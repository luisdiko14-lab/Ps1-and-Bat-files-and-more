cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-clipboard.Clipboard",
      "file": "plugins/cordova-clipboard/www/clipboard.js",
      "pluginId": "cordova-clipboard",
      "clobbers": [
        "cordova.plugins.clipboard"
      ]
    },
    {
      "id": "cordova-plugin-audioroute.AudioRoute",
      "file": "plugins/cordova-plugin-audioroute/www/audioroute.js",
      "pluginId": "cordova-plugin-audioroute",
      "clobbers": [
        "cordova.plugins.audioroute"
      ]
    },
    {
      "id": "cordova-plugin-device.device",
      "file": "plugins/cordova-plugin-device/www/device.js",
      "pluginId": "cordova-plugin-device",
      "clobbers": [
        "device"
      ]
    },
    {
      "id": "cordova-plugin-fullscreen.AndroidFullScreen",
      "file": "plugins/cordova-plugin-fullscreen/www/AndroidFullScreen.js",
      "pluginId": "cordova-plugin-fullscreen",
      "clobbers": [
        "AndroidFullScreen"
      ]
    },
    {
      "id": "cordova-plugin-icloudkv.iCloudKV",
      "file": "plugins/cordova-plugin-icloudkv/www/iCloudKV.js",
      "pluginId": "cordova-plugin-icloudkv",
      "clobbers": [
        "iCloudKV"
      ]
    },
    {
      "id": "cordova-plugin-inappbrowser.inappbrowser",
      "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
      "pluginId": "cordova-plugin-inappbrowser",
      "clobbers": [
        "cordova.InAppBrowser.open"
      ]
    },
    {
      "id": "cordova-plugin-insomnia.Insomnia",
      "file": "plugins/cordova-plugin-insomnia/www/Insomnia.js",
      "pluginId": "cordova-plugin-insomnia",
      "clobbers": [
        "window.plugins.insomnia"
      ]
    },
    {
      "id": "cordova-plugin-splashscreen.SplashScreen",
      "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
      "pluginId": "cordova-plugin-splashscreen",
      "clobbers": [
        "navigator.splashscreen"
      ]
    },
    {
      "id": "cordova-plugin-statusbar.statusbar",
      "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
      "pluginId": "cordova-plugin-statusbar",
      "clobbers": [
        "window.StatusBar"
      ]
    },
    {
      "id": "es6-promise-plugin.Promise",
      "file": "plugins/es6-promise-plugin/www/promise.js",
      "pluginId": "es6-promise-plugin",
      "runs": true
    },
    {
      "id": "cordova-plugin-x-socialsharing.SocialSharing",
      "file": "plugins/cordova-plugin-x-socialsharing/www/SocialSharing.js",
      "pluginId": "cordova-plugin-x-socialsharing",
      "clobbers": [
        "window.plugins.socialsharing"
      ]
    },
    {
      "id": "cordova-silent-mode.SilentModePlugin",
      "file": "plugins/cordova-silent-mode/www/silent-mode.js",
      "pluginId": "cordova-silent-mode",
      "clobbers": [
        "SilentMode"
      ]
    },
    {
      "id": "ionic-plugin-keyboard.keyboard",
      "file": "plugins/ionic-plugin-keyboard/www/android/keyboard.js",
      "pluginId": "ionic-plugin-keyboard",
      "clobbers": [
        "cordova.plugins.Keyboard"
      ],
      "runs": true
    },
    {
      "id": "cordova-plugin-bluetoothle.BluetoothLe",
      "file": "plugins/cordova-plugin-bluetoothle/www/bluetoothle.js",
      "pluginId": "cordova-plugin-bluetoothle",
      "clobbers": [
        "window.bluetoothle"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-clipboard": "1.3.0",
    "cordova-plugin-audioroute": "0.1.2",
    "cordova-plugin-device": "2.0.3",
    "cordova-plugin-fullscreen": "1.3.0",
    "cordova-plugin-icloudkv": "0.4.1",
    "cordova-plugin-inappbrowser": "5.0.0",
    "cordova-plugin-insomnia": "4.3.0",
    "cordova-plugin-splashscreen": "6.0.0",
    "cordova-plugin-statusbar": "2.4.3",
    "es6-promise-plugin": "4.2.2",
    "cordova-plugin-x-socialsharing": "6.0.3",
    "cordova-silent-mode": "0.9.0",
    "ionic-plugin-keyboard": "2.2.1",
    "cordova-plugin-bluetoothle": "6.6.1"
  };
});