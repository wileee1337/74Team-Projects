// The script is made for v18.104
// script have (debug menu, gradients, offlinebattles, toast)
// Script made by 74Team <3
var cache = {};

const base = Process.findModuleByName('libg.so').base;
const server_connection = 0xA2B454;
const pthread_cond_wake_return = 0x6108AA + 8 + 1;
const create_message_by_type = 0x14161C;
const select_return = 0xB7060;
const wakeup_return_array = [0x889ac, 0x122af8, 0x1a29d0, 0x49d004, 0x52bdb0, 0x53efb4];
const debug_menu_ctor = 0x3A6E70;
const stage_add_child = 0x36D3A8;
const stage_address = 0xA2B360;
const add_file = 0x3A3C84;
const ascdebugsc = 0x9E4F2E;
const debug_menu_update_ptr = 0x10DDC4;
const gradients = 0x4A9B08;
const offlinebattle = 0x258964;

var IsDebugMenuOpened = 0;

var malloc = new NativeFunction(Module.findExportByName('libc.so', 'malloc'), 'pointer', ['int']);
var free = new NativeFunction(Module.findExportByName('libc.so', 'free'), 'void', ['pointer']);
var pthread_mutex_lock = new NativeFunction(Module.findExportByName('libc.so', 'pthread_mutex_lock'), 'int', ['pointer']);
var pthread_mutex_unlock = new NativeFunction(Module.findExportByName('libc.so', 'pthread_mutex_unlock'), 'int', ['pointer']);
var pthread_cond_signal = new NativeFunction(Module.findExportByName('libc.so', 'pthread_cond_signal'), 'int', ['pointer']);
var select = new NativeFunction(Module.findExportByName('libc.so', 'select'), 'int', ['int', 'pointer', 'pointer', 'pointer', 'pointer']);
var memmove = new NativeFunction(Module.findExportByName('libc.so', 'memmove'), 'pointer', ['pointer', 'pointer', 'int']);
var ntohs = new NativeFunction(Module.findExportByName('libc.so', 'ntohs'), 'uint16', ['uint16']);
var inet_addr = new NativeFunction(Module.findExportByName('libc.so', 'inet_addr'), 'int', ['pointer']);
var libc_send = new NativeFunction(Module.findExportByName('libc.so', 'send'), 'int', ['int', 'pointer', 'int', 'int']);
var libc_recv = new NativeFunction(Module.findExportByName('libc.so', 'recv'), 'int', ['int', 'pointer', 'int', 'int']);

function strPtr(content) {
    return Memory.allocUtf8String(content);
}

var Message = {
    _getByteStream: function(m) { return m.add(8); },
    _getVersion: function(m) { return Memory.readInt(m.add(4)); },
    _setVersion: function(m, v) { Memory.writeInt(m.add(4), v); },
    _getMessageType: function(m) { return (new NativeFunction(Memory.readPointer(Memory.readPointer(m).add(20)), 'int', ['pointer']))(m); },
    _encode: function(m) { (new NativeFunction(Memory.readPointer(Memory.readPointer(m).add(8)), 'void', ['pointer']))(m); },
    _decode: function(m) { (new NativeFunction(Memory.readPointer(Memory.readPointer(m).add(12)), 'void', ['pointer']))(m); }
};

var ByteStream = {
    _getOffset: function(b) { return Memory.readInt(b.add(16)); },
    _getByteArray: function(b) { return Memory.readPointer(b.add(28)); },
    _setByteArray: function(b, a) { Memory.writePointer(b.add(28), a); },
    _setLength: function(b, l) { Memory.writeInt(b.add(20), l); }
};

var Buffer = {
    _getEncodingLength: function(b) { return Memory.readU8(b.add(2)) << 16 | Memory.readU8(b.add(3)) << 8 | Memory.readU8(b.add(4)); },
    _setEncodingLength: function(b, l) { Memory.writeU8(b.add(2), l >> 16 & 0xFF); Memory.writeU8(b.add(3), l >> 8 & 0xFF); Memory.writeU8(b.add(4), l & 0xFF); },
    _setMessageType: function(b, t) { Memory.writeU8(b.add(0), t >> 8 & 0xFF); Memory.writeU8(b.add(1), t & 0xFF); },
    _getMessageVersion: function(b) { return Memory.readU8(b.add(5)) << 8 | Memory.readU8(b.add(6)); },
    _setMessageVersion: function(b, v) { Memory.writeU8(b.add(5), v >> 8 & 0xFF); Memory.writeU8(b.add(6), v & 0xFF); },
    _getMessageType: function(b) { return Memory.readU8(b) << 8 | Memory.readU8(b.add(1)); }
};

var MessageQueue = {
    _getCapacity: function(q) { return Memory.readInt(q.add(4)); },
    _get: function(q, i) { return Memory.readPointer(Memory.readPointer(q).add(4 * i)); },
    _set: function(q, i, m) { Memory.writePointer(Memory.readPointer(q).add(4 * i), m); },
    _count: function(q) { return Memory.readInt(q.add(8)); },
    _getDequeueIndex: function(q) { return Memory.readInt(q.add(12)); },
    _getEnqueueIndex: function(q) { return Memory.readInt(q.add(16)); },
    _setDequeueIndex: function(q, i) { Memory.writeInt(q.add(12), i); },
    _setEnqueueIndex: function(q, i) { Memory.writeInt(q.add(16), i); },
    _dequeue: function(q) {
        var m = null;
        pthread_mutex_lock(q.sub(4));
        if (MessageQueue._count(q)) {
            var i = MessageQueue._getDequeueIndex(q);
            m = MessageQueue._get(q, i);
            MessageQueue._setDequeueIndex(q, (i + 1) % MessageQueue._getCapacity(q));
            Memory.writeInt(q.add(8), Memory.readInt(q.add(8)) - 1);
        }
        pthread_mutex_unlock(q.sub(4));
        return m;
    }
};

const StageAdd = new NativeFunction(base.add(stage_add_child), 'void', ['pointer', 'pointer']);
const StageRemove = new NativeFunction(base.add(0x2EB38C), 'void', ['pointer', 'pointer']);
const fSetXY = new NativeFunction(base.add(0x3BAE28), 'void', ['pointer', 'float', 'float']);
const AddFile = new NativeFunction(base.add(add_file), 'int', ['pointer', 'pointer', 'int', 'int', 'int', 'int']);
const DebugMenuCtor = new NativeFunction(base.add(debug_menu_ctor), 'pointer', ['pointer']);
const DebugMenuUpdate = new NativeFunction(base.add(debug_menu_update_ptr), "int", ["pointer", "float"]);

function DebugMenu_createDebugButton() {
    let DebugMenuButton = malloc(1000);
    new NativeFunction(base.add(0x403574), 'void', ['pointer'])(DebugMenuButton);
    let movieClip = new NativeFunction(base.add(0x13AE10), 'pointer', ['pointer', 'pointer', 'bool'])(strPtr("sc/debug.sc"), strPtr("debug_menu_button"), 1);
    new NativeFunction(base.add(0x29B6B4), 'void', ['pointer', 'pointer'])(DebugMenuButton, movieClip);

    StageAdd(base.add(stage_address).readPointer(), DebugMenuButton);
    fSetXY(DebugMenuButton, -30, 530);

    Interceptor.attach(base.add(0x2C7288), {
        onEnter(args) {
            if (args[0].toInt32() == DebugMenuButton.toInt32()) {
                if (IsDebugMenuOpened == 0) {
                    IsDebugMenuOpened = 1;
                    StageAdd(base.add(stage_address).readPointer(), cache.dptr);
                }
                else if (IsDebugMenuOpened == 1) {
                    IsDebugMenuOpened = 0;
                    StageRemove(base.add(stage_address).readPointer(), cache.dptr);
                }
            }
        }
    });
}

function team() {
    var updater = Interceptor.attach(Module.findExportByName('libc.so', 'pthread_cond_signal'), {
        onEnter: function(args) {
            DebugMenuUpdate(cache.dptr, 20);
        }
    });
}

function Gradients() {
    Interceptor.attach(base.add(gradients), {
        onEnter(args) {
            args[7] = ptr(1);
        }
    });
}    

function OfflineBattle() {
    Interceptor.attach(base.add(offlinebattle), {
        onEnter(args) {
            args[3] = ptr(3);
            args[6] = ptr(1);
            args[8] = ptr(1);
        }
    });
}

function setupMessaging() {
    cache.wakeUpReturnArray = wakeup_return_array.map(x => base.add(x));
    cache.pthreadReturn = base.add(pthread_cond_wake_return);
    cache.selectReturn = base.add(select_return);
    cache.serverConnection = Memory.readPointer(base.add(server_connection));
    cache.messaging = Memory.readPointer(cache.serverConnection.add(4));
    cache.messageFactory = Memory.readPointer(cache.messaging.add(52));
    cache.recvQueue = cache.messaging.add(60);
    cache.sendQueue = cache.messaging.add(84);
    cache.state = cache.messaging.add(212);
    cache.loginMessagePtr = cache.messaging.add(216);
    cache.createMessageByType = new NativeFunction(base.add(create_message_by_type), 'pointer', ['pointer', 'int']);

    cache.sendMessage = function(m) {
        Message._encode(m);
        var bs = Message._getByteStream(m);
        var len = ByteStream._getOffset(bs);
        var buf = malloc(len + 7);
        memmove(buf.add(7), ByteStream._getByteArray(bs), len);
        Buffer._setEncodingLength(buf, len);
        Buffer._setMessageType(buf, Message._getMessageType(m));
        Buffer._setMessageVersion(buf, Message._getVersion(m));
        libc_send(cache.fd, buf, len + 7, 0);
        free(buf);
    };

    function onWakeup() {
        var m = MessageQueue._dequeue(cache.sendQueue);
        while (m) {
            var t = Message._getMessageType(m);
            if (t === 10100) {
                m = Memory.readPointer(cache.loginMessagePtr);
                Memory.writePointer(cache.loginMessagePtr, ptr(0));
            }
            cache.sendMessage(m);
            m = MessageQueue._dequeue(cache.sendQueue);
        }
    }

    function onReceive() {
        var hdr = malloc(7);
        libc_recv(cache.fd, hdr, 7, 256);
        var t = Buffer._getMessageType(hdr);
        
        if (t >= 20000) {
            if (t === 20104) Memory.writeInt(cache.state, 5);
            if (t === 24101) {
                Memory.writeInt(cache.state, 5);
                OfflineBattle();
                Gradients();
                setTimeout(function() {
                    IsDebugMenuOpened = 0;
                    cache.dptr = malloc(500);
                    DebugMenuCtor(cache.dptr);
                    team();
                    DebugMenu_createDebugButton();
                }, 2000);
            }
            var len = Buffer._getEncodingLength(hdr);
            var v = Buffer._getMessageVersion(hdr);
            free(hdr);
            var buf = malloc(len);
            libc_recv(cache.fd, buf, len, 256);
            var m = cache.createMessageByType(cache.messageFactory, t);
            Message._setVersion(m, v);
            var bs = Message._getByteStream(m);
            ByteStream._setLength(bs, len);
            if (len) {
                var arr = malloc(len);
                memmove(arr, buf, len);
                ByteStream._setByteArray(bs, arr);
            }
            Message._decode(m);
            pthread_mutex_lock(cache.recvQueue.sub(4));
            var i = MessageQueue._getEnqueueIndex(cache.recvQueue);
            MessageQueue._set(cache.recvQueue, i, m);
            MessageQueue._setEnqueueIndex(cache.recvQueue, (i + 1) % MessageQueue._getCapacity(cache.recvQueue));
            Memory.writeInt(cache.recvQueue.add(8), Memory.readInt(cache.recvQueue.add(8)) + 1);
            pthread_mutex_unlock(cache.recvQueue.sub(4));
            free(buf);
        }
    }

    Interceptor.replace(Module.findExportByName('libc.so', 'pthread_cond_signal'), new NativeCallback(function(a1) {
        if (!this.returnAddress.equals(cache.pthreadReturn)) return pthread_cond_signal(a1);
        var sp4 = Memory.readPointer(this.context.sp.add(4));
        for (var i = 0; i < cache.wakeUpReturnArray.length; i++) {
            if (sp4.equals(cache.wakeUpReturnArray[i])) {
                onWakeup();
                return 0;
            }
        }
        return pthread_cond_signal(a1);
    }, 'int', ['pointer']));

    Interceptor.replace(Module.findExportByName('libc.so', 'select'), new NativeCallback(function(nfds, readfds, writefds, exceptfds, timeout) {
        var r = select(nfds, readfds, writefds, exceptfds, timeout);
        if (this.returnAddress.equals(cache.selectReturn)) onReceive();
        return r;
    }, 'int', ['int', 'pointer', 'pointer', 'pointer', 'pointer']));
}

const adder = Interceptor.attach(base.add(add_file), {
    onEnter: function(args) {
        adder.detach();
        AddFile(args[0], base.add(ascdebugsc), -1, -1, -1, -1);
    }
});

Interceptor.attach(Module.findExportByName('libc.so', 'connect'), {
    onEnter: function(args) {
        if (ntohs(Memory.readU16(args[1].add(2))) === 9339) {
            cache.fd = args[0].toInt32();
            Memory.writeInt(args[1].add(4), inet_addr(Memory.allocUtf8String("127.0.0.1")));
            Interceptor.revert(Module.findExportByName('libc.so', 'pthread_cond_signal'));
            Interceptor.revert(Module.findExportByName('libc.so', 'select'));
            setupMessaging();
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
toast("t.me/seventyfourteam");