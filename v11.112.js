// The script is made for Brawl Stars v11.112 (IP and port settings, toast)
// Script made by 74Team <3
const base = Module.findBaseAddress("libg.so");
const readPtr = Module.findExportByName('libc.so', 'read');
const ipserv = "127.0.0.1";
const port = 9339;
const cache = {};
let check = 0;
let buf = null;

function ntohs(val) {
    return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
}

function inet_addr(addr) {
    const p = addr.split('.');
    return (parseInt(p[0]) << 0) | (parseInt(p[1]) << 8) | (parseInt(p[2]) << 16) | (parseInt(p[3]) << 24);
}

Interceptor.attach(readPtr, {
    onEnter: function(args) {
        if(args[2].toInt32() == 32) {
            check = 1;
            buf = args[1];
        }
    },
    onLeave: function(args) {
        if(check == 1) {
            Memory.writeByteArray(buf, [0xBB, 0x14, 0xD6, 0xFD, 0x2B, 0x7C, 0x98, 0x23, 0xEA, 0xED, 0xB4, 0x33, 0x8C, 0xB7, 0x23, 0x7F, 0x61, 0xE4, 0x22, 0xD2, 0x3C, 0x49, 0x77, 0xF7, 0x4A, 0xDA, 0x05, 0x27, 0x02, 0xC0, 0xC6, 0x2D]);
            check = 0;
        }
    }
});

Interceptor.attach(Module.findExportByName('libc.so', 'connect'), {
    onEnter: function(args) {
        if (ntohs(Memory.readU16(args[1].add(2))) === port) {
            cache.fd = args[0].toInt32();
            Memory.writeU32(args[1].add(4), inet_addr(ipserv));
            Interceptor.revert(Module.findExportByName('libc.so', 'pthread_cond_signal'));
            Interceptor.revert(Module.findExportByName('libc.so', 'select'));
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