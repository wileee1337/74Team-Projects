// Clash of clans offline mode v5.2.4 (Debug Menu)
// Script made by 74Team <3
const base = Module.findBaseAddress("libg.so");
base.add(0x2F728C).writeU8(1);

const Libg = {
    _fn: (symbol, ret, args) => new NativeFunction(Module.findExportByName("libg.so", symbol), ret, args),
    malloc: new NativeFunction(Module.findExportByName('libc.so', 'malloc'), 'pointer', ['int']),
    free: new NativeFunction(Module.findExportByName('libc.so', 'free'), 'void', ['pointer']),

    stringCtor: function(str) {
        const mem = this.malloc(32);
        this._fn("_ZN6StringC2EPKc", 'void', ['pointer', 'pointer'])(mem, Memory.allocUtf8String(str));
        return mem;
    },
};

const funcs = {
    magicButtonCtor: Libg._fn("_ZN11MagicButtonC2Ev", 'void', ['pointer']),
    getMovieClip: Libg._fn("_ZN11StringTable12getMovieClipERK6StringS2_", 'pointer', ['pointer', 'pointer']),
    setMovieClip: Libg._fn("_ZN12CustomButton12setMovieClipEP9MovieClipb", 'void', ['pointer', 'pointer', 'int']),
    setXY: Libg._fn("_ZN13DisplayObject5setXYEff", 'void', ['pointer', 'float', 'float']),
    stageAdd: Libg._fn("_ZN5Stage8addChildEP13DisplayObject", 'pointer', ['pointer', 'pointer']),
    stageRemove: Libg._fn("_ZN5Stage11removeChildEP13DisplayObject", 'pointer', ['pointer', 'pointer']),
    addResource: Libg._fn("_ZN16ResourceListener7addFileEPKc", "void", ["pointer", "pointer"]),
    debugMenuCtor: Libg._fn("_ZN9DebugMenuC2Ev", "void", ["pointer"]),
    debugMenuUpdate: Libg._fn("_ZN13DebugMenuBase6updateEf", "int", ["pointer", "float"]),
};

const stage = base.add(Module.findExportByName("libg.so", "_ZN5Stage12sm_pInstanceE").sub(base));
let menuState = null;

function closeDebugMenu() {
    if (!menuState) return;
    menuState.hudUpdate.detach();
    menuState.closeHook.detach();
    funcs.stageRemove(stage.readPointer(), menuState.ptr);
    Libg.free(menuState.ptr);
    menuState = null;
}

function openDebugMenu() {
    if (menuState) return;
    const ptr = Libg.malloc(1000);
    funcs.debugMenuCtor(ptr);
    funcs.stageAdd(stage.readPointer(), ptr);

    const hudUpdate = Interceptor.attach(Module.findExportByName("libg.so", "_ZN3HUD6updateEf"), {
        onEnter: () => funcs.debugMenuUpdate(ptr, 20)
    });
    const closeHook = Interceptor.attach(Module.findExportByName("libg.so", "_ZN21ToggleDebugMenuButton13buttonPressedEv"), {
        onEnter: () => closeDebugMenu()
    });
    menuState = { ptr, hudUpdate, closeHook };
}

Interceptor.attach(Module.findExportByName("libg.so", "_ZN8GameMode18addResourcesToLoadEP16ResourceListener"), {
    onEnter: (args) => funcs.addResource(args[1], Memory.allocUtf8String("sc/debug.sc"))
});

Interceptor.attach(Module.findExportByName("libg.so", "_ZN8MoneyHUDC2EP9MovieClip"), {
    onEnter() {
        const dbgBtn = Libg.malloc(300);
        funcs.magicButtonCtor(dbgBtn);
        const fileNameStr = Libg.stringCtor("sc/debug.sc");
        const clipNameStr = Libg.stringCtor("debug_menu_item");
        funcs.setMovieClip(dbgBtn, funcs.getMovieClip(fileNameStr, clipNameStr), 1);
        funcs.setXY(dbgBtn, 1100, 600);
        funcs.stageAdd(stage.readPointer(), dbgBtn);

        Interceptor.attach(Module.findExportByName("libg.so", "_ZN12CustomButton13buttonPressedEv"), {
            onEnter(args) {
                if (args[0].equals(dbgBtn)) {
                    menuState ? closeDebugMenu() : openDebugMenu();
                }
            }
        });
    }
});
function toast(toastText) {	
	Java.perform(function() { 
		var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();

		Java.scheduleOnMainThread(function() {
				var toast = Java.use("android.widget.Toast");
				toast.makeText(context, Java.use("java.lang.String").$new(toastText), 1).show();
		});
	});
}
toast("Script by 74Team <3"); // Write your text here!!!