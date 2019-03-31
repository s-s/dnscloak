# cordova-plugin-ionic-keyboard

This plugin has been designed to work seamlessly with `cordova-plugin-ionic-webview`, so make sure you have it installed first:

 - https://github.com/ionic-team/cordova-plugin-ionic-webview
 - https://ionicframework.com/docs/wkwebview/

## Installation

```
cordova plugin add cordova-plugin-ionic-keyboard --save
```

## Preferences

### KeyboardResize

> Boolean (true by default)

#### Possible values
- `true`: Showing/hiding the keyboard will trigger some kind of resizing of the app (see KeyboardResizeMode)
- `false`: Web will not be resized when the keyboard shows up.

```xml
<preference name="KeyboardResize" value="true" />
```

### KeyboardResizeMode

> String ('native' by default)

#### Possible values

- `native`: The whole native webview will be resized when the keyboard shows/hides, it will affect the `vh` relative unit.
- `body`: Only the html `<body>` element will be resized. Relative units are not affected, because the viewport does not change.
- `ionic`: Only the html `ion-app` element will be resized. Only for ionic apps.

```xml
<preference name="KeyboardResizeMode" value="native" />
```


## Methods

### Keyboard.hideFormAccessoryBar

> Hide the keyboard toolbar.

Set to true to hide the additional toolbar that is on top of the keyboard. This toolbar features the Prev, Next, and Done buttons.

```js
Keyboard.hideFormAccessoryBar(value, successCallback);
```

##### Quick Example

```js
Keyboard.hideFormAccessoryBar(true);
Keyboard.hideFormAccessoryBar(false);
Keyboard.hideFormAccessoryBar(null, (currentValue) => { console.log(currentValue); });
```

### Keyboard.hide

> Hide the keyboard

Call this method to hide the keyboard

```js
Keyboard.hide();
```


### Keyboard.show

> Show the keyboard

Call this method to show the keyboard.

```js
Keyboard.show();
```

## Properties

### Keyboard.isVisible

> Determine if the keyboard is visible.

Read this property to determine if the keyboard is visible.

```js
if (Keyboard.isVisible) {
    // do something
}
```

## Events

### keyboardDidHide

> This event is fired when the keyboard is fully closed.

Attach handler to this event to be able to receive notification when keyboard is closed.

```js
window.addEventListener('keyboardDidHide', () => {
    // Describe your logic which will be run each time keyboard is closed.
});
```

### keyboardDidShow

> This event is fired when the keyboard is fully open.

Attach handler to this event to be able to receive notification when keyboard is opened.

```js
window.addEventListener('keyboardDidShow', (event) => {
    // Describe your logic which will be run each time when keyboard is about to be shown.
    console.log(event.keyboardHeight);
});
```

### keyboardWillShow

> This event fires before keyboard will be shown.

Attach handler to this event to be able to receive notification when keyboard is about to be shown on the screen.

```js
window.addEventListener('keyboardWillShow', (event) => {
    // Describe your logic which will be run each time when keyboard is about to be shown.
    console.log(event.keyboardHeight);
});
```

### keyboardWillHide

> This event is fired when the keyboard is fully closed.

Attach handler to this event to be able to receive notification when keyboard is about to be closed.

```js
window.addEventListener('keyboardWillHide', () => {
    // Describe your logic which will be run each time when keyboard is about to be closed.
});
```
