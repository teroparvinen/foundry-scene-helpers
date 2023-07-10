
Hooks.on("init", () => {
    game.settings.register("scene-helpers", "doubleclick", {
        name: "scene-helpers.setting-doubleclick",
        scope: "world",
        config: true,
        type: String,
        choices: {
            notes: "scene-helpers.setting-doubleclick-notes",
            config: "scene-helpers.setting-doubleclick-config"
        },
        default: "notes"
    });
});

Hooks.on("setup", () => {
    libWrapper.register("scene-helpers", "SceneDirectory.prototype.activateListeners", onSceneDirectoryListeners, "MIXED");
    libWrapper.register("scene-helpers", "SceneNavigation.prototype._onClickScene", onClickScene, "MIXED");
});

function onSceneDirectoryListeners(wrapped, html) {
    html.find(".document.scene")
        .click((event) => {
            const element = event.currentTarget;
            const documentId = element.dataset.documentId;
            const document = this.constructor.collection.get(documentId);
        
            if (document.testUserPermission(game.user, "LIMITED")) {
                if ((event.ctrlKey || event.metaKey) && !event.altKey) {
                    document.activate();
                } else if (!(event.ctrlKey || event.metaKey) && event.altKey) {
                    if (game.user.isGM) {
                        const sheet = document.sheet;
                        if (sheet.rendered) {
                            sheet.maximize();
                            sheet.bringToTop();
                        } else {
                            sheet.render(true);
                        }
                    }
                } else {
                    document.view();
                }
            }
        });

    wrapped(html);
}

function togglePin(event) {
    if (game.user.isGM) {
        const sceneId = event.target.closest('.scene').dataset.sceneId;
        const scene = game.scenes.get(sceneId);
        scene.update({ navigation: !scene.navigation });
    }
}

function onClickScene(wrapped, event) {
    if (event.altKey || event.metaKey) {
        togglePin(event);
    } else {
        wrapped(event);
    }
}

Hooks.on("renderSceneNavigation", (app, html, data) => {
    if (game.user.isGM) {
        const viewed = html.find('.scene.view');
        if (viewed.length) {
            const viewedSceneId = viewed[0].dataset.sceneId;
            const scene = game.scenes.get(viewedSceneId);
            const isPinned = scene.navigation;
            const isActive = scene.active;
            if (isPinned) {
                if (isActive) {
                    html.find('.scene.view .scene-name i').after('<i class="fas fa-map-pin pin-icon"></i>');
                } else {
                    html.find('.scene.view .scene-name').prepend('<i class="fas fa-map-pin pin-icon"></i>');
                }
            }
        }

        viewed
            .off("click")
            .on("click", function(event) {
                if (event.altKey || event.metaKey) {
                    togglePin(event);
                }
            })
            .on("dblclick", function(event) {
                const viewedSceneId = this.dataset.sceneId;
                const scene = game.scenes.get(viewedSceneId);
                const op = game.settings.get("scene-helpers", "doubleclick");
    
                if (op === "notes") {
                    const entry = scene.journal;
                    if (entry) {
                        const sheet = entry.sheet;
                        const options = {};
                        if (scene.journalEntryPage) options.pageId = scene.journalEntryPage;
                        sheet.render(true, options);
                    }
                } else if (op === "config") {
                    const sheet = scene.sheet;
                    if (sheet.rendered) {
                        sheet.maximize();
                        sheet.bringToTop();
                    } else {
                        sheet.render(true);
                    }
                }
            });
    }
});
