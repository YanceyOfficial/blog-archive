# js 遍历数组、对象总结

![logo](https://edge.yancey.app/beg/pixiv58255799_0-1024x485.png)

> 最近写 Vue 偏多，在写一些普通页面时，原生 JS 的一些方法居然一时半会儿想不出来了，趁放假赶紧总结一下。刚在教务处弄完论文查重，居然是 0.9%... 自己的毕业恭喜了。

## 对象遍历

以下用 userInfo 这个对象：

```ts
const userInfo = {
  firstName: "Leo",
  lastName: "Yancey",
  mail: "yanceyleo@yanceyleo.com",
  cellPhone: "15011189639",
  address: "Osaka, Japan",
  userId: "10000",
  userName: "yanceyleo",
  userPwd: "698739FB1B88A93504C4FBAB1CD3F356",
  registerDate: "1526202820298",
};
```

### for-in

```ts
// for-in遍历对象自身的和继承的可枚举属性(不含Symbol属性)
for (let key in userInfo) {
  console.log(`${key} - ${userInfo[key]}`);
}
```

### Object.keys()

```ts
// Object.keys()遍历对象自身的可枚举属性(不含继承的和Symbol属性)
Object.keys(userInfo).forEach(function (key) {
  console.log(`${key} - ${userInfo[key]}`);
});
```

### Object.getOwnPropertyNames()

```ts
// Object.getOwnPropertyNames()遍历对象自身的所有属性(不含Symbol属性，但包含不可枚举的)
Object.getOwnPropertyNames(userInfo).forEach(function (key) {
  console.log(`${key} - ${userInfo[key]}`);
});
```

### Reflect.ownKeys()

```ts
// 来个ES6的 Reflect.ownKeys()遍历对象自身的所有属性,不管属性名是Symbol或字符串,也不管是否可枚举。
Reflect.ownKeys(userInfo).forEach(function (key) {
  console.log(`${key} - ${userInfo[key]}`);
});
```

## 数组遍历

以下用 colors 这个数组：

```ts
const colors = ["blue", "green", "white", "black", "pink"];
```

### for...in

```ts
// for-in遍历数组
for (let index in colors) {
  console.log(`${index} - ${colors[index]}`);
}
```

### for-of

```ts
// for-of遍历数组 for-of不能用来遍历对象
for (let value of colors) {
  console.log(value);
}
```

### forEach

```ts
// forEach遍历数组
colors.forEach(function (value, index) {
  console.log(`${index} - ${value}`);
});
```
