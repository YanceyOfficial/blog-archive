# JS 判断数据类型的多种方式

![logo](https://static.yancey.app/kv9wow9.png)

> 周末翻以前总结的面试题，看到这篇文章的时候发现有一些错误，决定推翻重写，以加深印象。虽然大部分都是打酱油的方法，毕竟 Object.prototype.toString.call() 一把梭解决一切。当然考虑到面试，我认为这写都能好好的答出来，并且能说出各自的优缺点就足够了。

## 通用型

### typeof

首先想到的肯定是 typeof 了，但它有三个问题。

第一个是 `typeof null`会返回 `object`，第二个是当 typeof 一个 **未定义的变量**，会返回 `undefined`，而第三个则是最严重的，typeof 一个引用类型的变量都会返回 `object`，不论你是数组还是正则表达式。

### Object.prototype.toString.call()

这个应该是最好用的判断类型的方式，它完美解决了上述 `typeof` 存在的问题。不过最近一直用 TS 写代码，貌似前期早就定义好了类型，也就不至于手动查了。

但是该方法仍然不能判断一个类型是引用类型还是基本类型，看例子。因此，该方法和 typeof 配合食用最佳。typeof 用来判断基本类型还是引用类型，Object.prototype.toString.call()用来精准获取数据类型。

```js
const str = "abc";
const strObj = new String("abc");

function getType(data) {
  return Object.prototype.toString.call(data);
}

getType(str) === getType(strObj); // true
```

## 断言型

### instanceof

`instanceof`只对引用类型的变量有效，所以对于六种基本类型，如果按下面这个例子写的话就会返回`false`.

```
'abc' instanceof String; // false


```

所以你不得不这样写，才会返回 true, 但现实中一定没人那么傻。

```
const oStringObject = new String("hello world")
oStringObject instanceof String // true


```

即便是判断一个引用类型的变量，也不见得好使，它要求开发者明确地确认对象为某特定类型.

```
const reg = /^$/

reg instanceof RegExp // true

reg instanceof Object  // true


```

通常来讲，使用 instanceof 就是判断一个实例是否属于某种类型，更重要的一点是 instanceof 可以在继承关系中用来判断一个实例是否属于它的父类型。这里涉及原型链，不展开说，可以看 [JavaScript instanceof 运算符深入剖析](https://www.ibm.com/developerworks/cn/web/1306_jiangjj_jsinstanceof/index.html) 这篇文章。

### Object.getPrototypeOf()

这也是一个很酷的方法，`Object.getPrototypeOf()` 方法返回指定对象的原型（内部[[Prototype]] 属性的值。看下面几个例子，首先它是可以正确判断基本数据类型；其次，它也可以正确判断出引用类型的正确类型。

```
Object.getPrototypeOf('') === String.prototype // true

Object.getPrototypeOf(/^$/) === RegExp.prototype // true

Object.getPrototypeOf(/^$/) === Object.prototype // false


```

### **proto**

这个方法和 `Object.getPrototypeOf()` 的使用结果一模一样，直接看例子。

```
'str'.__proto__ === String.prototype // true

/^$/.__proto__ === RegExp.prototype // true

/^$/.__proto__ === Object.prototype // false


```

### isPrototypeOf()

`isPrototypeOf()` 方法用于测试一个对象是否存在于另一个对象的原型链上。它在判断数据类型时的效果和 `instanceof` 相同。但两者本质不同，在表达式 "object instanceof AFunction"中，object 的原型链是针对 AFunction.prototype 进行检查的，而不是针对 AFunction 本身。看例子

```
const oStringObject = new String("hello world")

String.prototype.isPrototypeOf(oStringObject) // true

String.prototype.isPrototypeOf('abc') // false

Array.prototype.isPrototypeOf([1,2,3]) // true

Object.prototype.isPrototypeOf([1,2,3]) // true


```

### Array.isArray(arr)

这个就不多说了，Array 自己的方法，只能判断是否数组用。
