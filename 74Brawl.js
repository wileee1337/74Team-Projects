// Script made for the very first version (V11.106) of Brawl Stars for Android!!!
// Script made by 74Team <3
const base = Module.findBaseAddress("libg.so");
const IPserv = "127.0.0.1";
const TARGET_PACKAGE_NAME = "com.seventyfourteam.brawlstars"; // your package!!!

const malloc = new NativeFunction(Module.findExportByName('libc.so', 'malloc'), 'pointer', ['int']);
const fopen = new NativeFunction(Module.findExportByName('libc.so', 'fopen'), 'pointer', ['pointer', 'pointer']);

var cache = {
    modules: {},
    options: {}
};

var csvFiles = [
    "csv_logic/cards.csv",
    "csv_logic/characters.csv",
    "csv_logic/skills.csv",
    "csv_logic/projectiles.csv",
    "csv_logic/area_effects.csv",
    "csv_logic/items.csv",
	"csv_logic/maps.csv",
	"csv_logic/skins.csv",
	"csv_logic/tiles.csv"
];

function getPackageName() {
    var packagename = '';
    Java.perform(function() {
        var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();
        packagename = context.getPackageName();         
    });
    return packagename;
}

function exit() {
    Java.scheduleOnMainThread(() => {
        Java.use("java.lang.System").exit(0);
    });
}

function createStringPtrFromJSString(message) {
    var charPtr = malloc(message.length + 1);
    Memory.writeUtf8String(charPtr, message);
    return charPtr;
}

function checkFilesInUpdate() {
	for (var i = 0; i < csvFiles.length; i++) {
		var path = '/data/data/' + getPackageName() + '/update/' + csvFiles[i];
		var pFile = fopen(createStringPtrFromJSString(path), createStringPtrFromJSString("rb"));
		if (pFile.toInt32() != 0) {
			exit();
		}
	}
}

if (getPackageName() !== TARGET_PACKAGE_NAME) {
    exit();
}

checkFilesInUpdate();

Interceptor.attach(Module.findExportByName("libc.so", "getaddrinfo"), {
    onEnter(args) {
        if (args[0].readUtf8String() == "game.brawlstarsgame.com") {
            args[0].writeUtf8String(IPserv);
        }
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
toast("Script made by 74Team <3"); // Write your text here!!!