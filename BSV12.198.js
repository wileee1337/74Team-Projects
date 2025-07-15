// The script was made at the request of SneakyPl4yR =)
// Script made for V12!!!
// Script made by 74Team<3
var cache = {
    modules: {},
    options: {}
};

const base = Module.findBaseAddress("libg.so");
const readPtr = Module.findExportByName('libc.so', 'read');
const ntohs = new NativeFunction(Module.findExportByName('libc.so', 'ntohs'), 'uint16', ['uint16']);
const inet_addr = new NativeFunction(Module.findExportByName('libc.so', 'inet_addr'), 'int', ['pointer']);
const IPserver = "127.0.0.1";

function setupNetworkRedirect() {
    Interceptor.attach(Module.findExportByName('libc.so', 'connect'), {
        onEnter: function(args) {
            if (ntohs(Memory.readU16(args[1].add(2))) === 9339) {
                var host = Memory.allocUtf8String(IPserver);
                Memory.writeInt(args[1].add(4), inet_addr(host));
            }
        }
    });
    
    var buffer;
    var shouldCheck = 0;
    var lastFd;

    const openHook = Interceptor.attach(Module.findExportByName("libc.so", "open"), {
        onEnter: function(args) {
            this.isUrandom = (Memory.readUtf8String(args[0]) == "/dev/urandom");
        },
        onLeave: function(retval) {
            if(this.isUrandom) {
                lastFd = retval.toInt32();
            }
        }
    });
            
    const readHook = Interceptor.attach(readPtr, {
        onEnter: function(args) {
            if(lastFd == args[0].toInt32() && args[2] == 32) {
                shouldCheck = 1;
                buffer = args[1];
            }
        },
        onLeave: function(args) {
            if(shouldCheck == 1) {
                Memory.writeByteArray(buffer, [0xBB, 0x14, 0xD6, 0xFD, 0x2B, 0x7C, 0x98, 0x23, 0xEA, 0xED, 0xB4, 0x33, 0x8C, 0xB7, 0x23, 0x7F, 0x61, 0xE4, 0x22, 0xD2, 0x3C, 0x49, 0x77, 0xF7, 0x4A, 0xDA, 0x05, 0x27, 0x02, 0xC0, 0xC6, 0x2D]);
                shouldCheck = 0;
            }
        }
    });
}

let serverRedirected = false;

Interceptor.attach(Module.findExportByName("libc.so", "getaddrinfo"), {
    onEnter(args) {
        const hostname = Memory.readUtf8String(args[0]);
        if (hostname && hostname.includes("supercell") && !serverRedirected) {
            args[0].writeUtf8String(IPserver);
            serverRedirected = true;
        }
    }
});

rpc.exports = {
    init: function(stage, options) {
        cache.options = options || {};
        setupNetworkRedirect();
    }
};

function toast(toastText) {	
	Java.perform(function() { 
		var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();

		Java.scheduleOnMainThread(function() {
				var toast = Java.use("android.widget.Toast");
				toast.makeText(context, Java.use("java.lang.String").$new(toastText), 1).show();
		});
	});
}
toast("made by 74Team <3");