// Offline mode Clash of clans V5.2.4 (74Clash)
// Script made by 74Team <3
const base = Module.findBaseAddress("libg.so");
base.add(0x2F728C).writeU8(1); // Offline Mode

function toast(toastText) {	
	Java.perform(function() { 
		var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();

		Java.scheduleOnMainThread(function() {
				var toast = Java.use("android.widget.Toast");
				toast.makeText(context, Java.use("java.lang.String").$new(toastText), 1).show();
		});
	});
}
toast("Toast guys"); // // Write your text here!!!