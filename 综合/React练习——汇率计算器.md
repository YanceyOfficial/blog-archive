# React 练习——汇率计算器

![logo](https://edge.yancey.app/beg/01f3b801-aed5-43eb-825d-dd79db2bb7e8.png)

> 这是学习 React 时候自己设计的一个小项目，居然折腾了一天。暂且不谈组件化，React 做多级联动简直爽到飞起。项目重点涉及了 React 组件间通讯，这个地方练熟了写 React 基本就无敌了。当然前提是能够合理的划分出 UI 组件层级。

## 先来一段动图

![动图演示](https://edge.yancey.app/beg/3c05a686-5fd7-4410-9eb2-42a79c674973.gif)

##　昨天的面试

昨天面试问到“你是如何学习新知识的？“

1. 就以 React 为例吧，先去拉勾找到学习 React 的动力（你懂的）；

2. 去知乎搜索”React 能做什么“，看大牛们的解释（个人很喜欢他们精辟的比喻），大致知道 React 的思想是什么，能做哪些事，比起传统做法有什么优点；

3. 简单纵向比较一下相关框架（如 vue、angular）的异同、优缺点（虽然 vue 还是要学的）；

4. 根据官方文档学习语法，利用 Google、Stack Overflow、Github 等填坑。这期间会学到很多除 React 本身的新东西，比如 fetch、axois、superagent 等等。总之这个阶段还是很难很难的，想从一楼跳下去的心都有啊喂;

5. 分阶段自行设计项目，检验学习成果。随着深入学习，进行项目的迭代与优化；

6. 作文以记之。

## 功能实现

![组件分割示意图](https://edge.yancey.app/beg/23001024-d8f4-43e7-a976-73337b65591f.png)

既然 React 的卖点是组件化（话说昨天面试小姐姐问 React 除了组件化还有什么，我居然忘了**声明式**，悔しい）。上图是自己的划分思路：

1. 首先粉色部分（① 区）显示的是实时汇率，初始值是美元和欧元的汇率比，当改变 ④ 或 ⑤，或者点击 ⑥ 时，① 区根据当前状态进行实时切换，而 ② 和 ③ 区的改变是不会影响 ① 区的；

2. ② 和 ③ 区可以输入数字，根据目前选定的汇率，来实时换算货币值，比如就上图来说，在 ② 区输入 10，③ 区会实时变成 8.12304；

3. ④ 和 ⑤ 区是整个组件的核心，它们的值决定着其他各组件的方方面面；

4. 当点击 ⑥ 区时，④ 和 ⑤ 当前选定的值会交换，② 区值不会变，但因为汇率发生了变化，③ 区的值将发生变动，此时 ① 区的汇率也将发生反转；

5. 当然最外层的 App 类控制 api 的异步加载。

## 关于 API

这里必须得多说几句，简直炸毛。

首先是在[fixer](https://fixer.io/)申请了 key，还不错，看下图。然鹅坑爹的是，他们家不提供**货币全称 API**(比如 USD 对应 United States Dollor；CNY 对应 Chinese Yuan 酱紫)。虽然做这个项目只需要实时汇率就足够了，但是只显示干巴巴的简称肯定是不友好滴。

然后又去了[currencylayer](https://currencylayer.com/)申请了 key，货币全称倒是有了，看下图，但他家的汇率 api 超级坑爹，免费用户只能以美金为 base 货币，不像 fixer 无限制。遂两家 api 一起用...

## 具体实现

### App 类

名字懒得起了，就叫 App 好了，这个类主要用来异步加载两个 json 文件，第一次用到了 fetch，听说能代替传统的 Ajax，与之类似的还有什么 axois、superagent,忙过这几天依次做一下研究。

```jsx
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ratesObj: "", countriesObj: "" };
  }

  componentDidMount() {
    // 注意fetch的语法，其实跟Promise差不多少
    this.getCurrencyRates = fetch(this.props.api.getCurrencyRatesAPI).then(
      (res) => {
        res
          .json()
          .then((resJSON) => this.setState({ ratesObj: resJSON.rates }));
      }
    );

    this.getCountries = fetch(this.props.api.getCountriesAPI).then((res) => {
      res
        .json()
        .then((resJSON) => this.setState({ countriesObj: resJSON.currencies }));
    });
  }

  componentWillUnmount() {
    this.getCurrencyRates.abort();
    this.getCountries.abort();
  }

  render() {
    return (
      <div>
        <CountryChoice
          ratesObj={this.state.ratesObj}
          countriesObj={this.state.countriesObj}
        />
      </div>
    );
  }
}

ReactDOM.render(
  // 这里的api是个对象，存放上面所说的两个url，这里就不贴出来了
  <App api={api} />,
  document.getElementById("root")
);
```

### 实时汇率展示类

这个类就是个受，自己啥都干不了。当 select 元素触发**onchange 事件**抑或 button 被点击(触发**onclick 事件**)时，这里就会发生变动。这个类只需要接受**CountryChoice 类**（就是上面说到的核心类）的三个参数，分别是示意图中 ④ 和 ⑤ 区正在被选中的那两个币种，还有就是两个币种之间的汇率。

```jsx
class CurrentExchangeRate extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <h1>
        1{" "}
        <span className="exchange-country-name">
          {this.props.firstSelectedCountry}
        </span>{" "}
        = {this.props.latestRates + " "}
        <span className="exchange-country-name">
          {this.props.secondSelectedCountry}
        </span>
      </h1>
    );
  }
}
```

### exchange 按钮类

这个类接受一个 Boolean 类型的 flag，flag 的定义同样是在**CountryChoice 类**里面，每点击一次按钮，flag 值就会从 true 和 false 之间切换，然后通过**this.props.buttonToggle**这个方法将实时的 flag 值传递回**CountryChoice 类**，当然**this.props.buttonToggle**方法定义在**CountryChoice 类**里，下面会说到。

```jsx
// exchange按钮交换两个select，同时会改变 实时汇率展示 模块
class ChangeCountry extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currentFlag: this.props.currentFlag };
    this.buttonClick = this.buttonClick.bind(this);
  }

  buttonClick() {
    // 一定要把 !this.state.currentFlag 先存到一个变量，再把这个变量赋值到setState里
    // 否则第一次点击按钮还是true，第二次才变成false
    const currentFlag = !this.state.currentFlag;
    this.setState({
      currentFlag: currentFlag,
    });
    this.props.buttonToggle(currentFlag);
  }

  render() {
    return (
      <button className="button" onClick={this.buttonClick}>
        Exchange
      </button>
    );
  }
}
```

### 金额输入类

首先先写一个 isNumber 方法，是为了阻止用户输入**非数字**，且只能输入一个**小数点**。因为有两个 input 元素，所以先给两个元素命名。因为在任意一个 input 中输入值都会实时影响到另一个，所以这里就涉及到了**状态提升**问题，可以去研究[官方文档-状态提升](https://doc.react-china.org/docs/lifting-state-up.html)的这个例子。

```jsx
// 命名两个input输入框
const inputNames = { f: "firstInput", s: "secondInput" };

function isNumber(input) {
  if (/^[0-9]+([.][0-9]*)?$/.test(input) === false) {
    return input.slice(0, -1);
  } else {
    return input;
  }
}

class MoneyInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(ev) {
    this.props.onInputChange(isNumber(ev.target.value));
  }

  render() {
    const inputName = this.props.inputName;
    const inputValue = this.props.inputValue;

    return (
      // 这里用到了ES6的计算属性名
      <input
        name={inputNames[inputName]}
        className="input-value"
        type="text"
        value={inputValue}
        placeholder="0"
        onChange={this.handleChange}
      />
    );
  }
}
```

### 币种（国家）选择类

高潮来了，额，重点来了。这个类控制着币种的选择，解释都放在了注释里，代码写得有点儿绕，都是 exchange 按钮惹的祸。写下来发现 React 的一个重点就是**React 组件间通讯**:

- 【父组件】向【子组件】传值；

- 【子组件】向【父组件】传值；

- 没有任何嵌套关系的组件之间传值（如：兄弟组件之间传值）

这里推荐两篇文章，一个是淘宝前端团队的[React 组件间通讯](http://taobaofed.org/blog/2016/11/17/react-components-communication/);另一个是在 SegmentFault 的一篇文章[React 组件之间如何交流](https://segmentfault.com/a/1190000004044592)，把人家演示的例子敲一敲，基本上就能理解了。

```jsx
// 货币选择：初始化第一个选中的是美刀，第二个选中的欧元
// 货币选择的变化影响着 汇率展示 和 汇率计算
class CountryChoice extends React.Component {
  constructor(props) {
    super(props);

    // 初始化状态
    this.state = {
      firstSelectedCountry: "USD", // 第一个默认被选中的币种是美金
      secondSelectedCountry: "EUR", // 第二个默认被选中的币种是欧元
      flag: true, // 立一个flag，初始是true，button被点击时在true和false之间切换
      inputName: "f", // 默认选中的是第一个input标签
      inputValue: "", // 默认input标签的值是空
    };

    this.handleChange = this.handleChange.bind(this);
    this.buttonToggle = this.buttonToggle.bind(this);
    this.firstInputChange = this.firstInputChange.bind(this);
    this.secondInputChange = this.secondInputChange.bind(this);
  }

  // 通过ChangeCountry类传递过来的flag值来设置成当前状态
  buttonToggle(flag) {
    this.setState({ flag: flag });
  }

  // 设置select标签的状态

  // 当flag是true时，把firstSelectedCountry的状态设置为name属性为“first-select”的value，
  // 把secondSelectedCountry的状态设置为name属性为“second-select”的value

  // 当flag是true时，把firstSelectedCountry的状态设置为name属性为“first-select”的value，
  // 把secondSelectedCountry的状态设置为name属性为“second-select”的value

  // 也就是说当flag是false时，此时name属性为“first-select”的select标签控制的是name属性为“second-select”的select标签
  // 当然我这里设计的不合理，应该通过动态修改name值才好，放在下一次的项目迭代吧，留个坑先
  handleChange(ev) {
    const target_name = ev.target.name;

    if (this.state.flag) {
      if (target_name === "first-select") {
        this.setState({ firstSelectedCountry: ev.target.value });
      } else if (target_name === "second-select") {
        this.setState({ secondSelectedCountry: ev.target.value });
      }
    } else {
      if (target_name === "first-select") {
        this.setState({ secondSelectedCountry: ev.target.value });
      } else if (target_name === "second-select") {
        this.setState({ firstSelectedCountry: ev.target.value });
      }
    }
  }

  // 获取第一个input输入的值
  firstInputChange(inputValue) {
    this.setState({ inputName: "f", inputValue });
  }

  // 获取第二个input输入的值
  secondInputChange(inputValue) {
    this.setState({ inputName: "s", inputValue });
  }

  render() {
    const inputName = this.state.inputName;
    const inputValue = this.state.inputValue;

    // 因为要用到用户输入的值乘以汇率来进行计算
    // 当用户清空某个input标签的值时，这里就成了NaN
    // 这个函数就是当检测到输入的值为空时，自动设为数字0
    // 啊啊啊，肯定有更好的方法
    function formatInputValue(inputValue) {
      if (inputValue === "") {
        inputValue = 0;
        return inputValue;
      } else {
        return parseFloat(inputValue);
      }
    }

    // 这边就写的很笨重了，汇率是根据flag的状态定的
    // 如果是true，汇率是第二个select标签选中的值除以第一个select
    // 假设当前在第一个input输入数值，那么下面的 inputName === 'f' 就是true， 所以第二个input的值（sI）就会被实时计算
    // 反正就是很绕，如果不加exchange按钮要省很多事儿，一切都是为了学习...
    const fI =
      inputName === "s"
        ? formatInputValue(inputValue) *
          (!this.state.flag
            ? this.props.ratesObj[this.state.secondSelectedCountry] /
              this.props.ratesObj[this.state.firstSelectedCountry]
            : this.props.ratesObj[this.state.firstSelectedCountry] /
              this.props.ratesObj[this.state.secondSelectedCountry])
        : inputValue;
    const sI =
      inputName === "f"
        ? formatInputValue(inputValue) *
          (this.state.flag
            ? this.props.ratesObj[this.state.secondSelectedCountry] /
              this.props.ratesObj[this.state.firstSelectedCountry]
            : this.props.ratesObj[this.state.firstSelectedCountry] /
              this.props.ratesObj[this.state.secondSelectedCountry])
        : inputValue;

    return (
      <div className="container">
        {/*这边就是把当前状态（两个被选中的货币全称和之间的汇率）传递给①区来显示*/}
        <CurrentExchangeRate
          firstSelectedCountry={
            this.state.flag
              ? this.props.countriesObj[this.state.firstSelectedCountry]
              : this.props.countriesObj[this.state.secondSelectedCountry]
          }
          secondSelectedCountry={
            !this.state.flag
              ? this.props.countriesObj[this.state.firstSelectedCountry]
              : this.props.countriesObj[this.state.secondSelectedCountry]
          }
          latestRates={
            this.state.flag
              ? this.props.ratesObj[this.state.secondSelectedCountry] /
                this.props.ratesObj[this.state.firstSelectedCountry]
              : this.props.ratesObj[this.state.firstSelectedCountry] /
                this.props.ratesObj[this.state.secondSelectedCountry]
          }
        />

        {/*当在第二个input输入数字时，换算出来的值会实时显示在第一个input里*/}
        <div className="item">
          <MoneyInput
            inputName="f"
            inputValue={fI}
            onInputChange={this.firstInputChange}
          />

          {/*传统设置默认选项是在option标签设置selected=selected, 现在放在select标签里，当然还有个Select的三方库*/}
          {/*通过map将option标签循环添加到第一个select标签里面*/}
          <select
            className="select"
            name="first-select"
            value={
              this.state.flag
                ? this.state.firstSelectedCountry
                : this.state.secondSelectedCountry
            }
            onChange={this.handleChange}
          >
            {Object.keys(this.props.ratesObj).map((key) => (
              <option key={key.toString()} value={key}>
                {key} - {this.props.countriesObj[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="item">
          // 当在第一个input输入数字时，换算出来的值会实时显示在第二个input里
          <MoneyInput
            inputName="s"
            inputValue={sI}
            onInputChange={this.secondInputChange}
          />
          {/*通过map将option标签循环添加到第一个select标签里面*/}
          <select
            className="select"
            name="second-select"
            value={
              !this.state.flag
                ? this.state.firstSelectedCountry
                : this.state.secondSelectedCountry
            }
            onChange={this.handleChange}
          >
            {Object.keys(this.props.ratesObj).map((key) => (
              <option key={key.toString()} value={key}>
                {key} - {this.props.countriesObj[key]}
              </option>
            ))}
          </select>
          {/*exchange按钮 将当前flag值传递给ChangeCountry类，同时将ChangeCountry类改变的flag值作为参数，通过buttonToggle方法传回当前这个类*/}
          <ChangeCountry currentFlag={this.state.flag} buttonToggle={(flag) => this.buttonToggle(flag)} />
        </div>
      </div>
    );
  }
}
```

##　写在最后

项目写的很丑，随着学习的深入还要进行迭代，加油吧。项目传到了[github](https://github.com/yanceyleo/currency-exchange-component-by-react)上了，没有劳驾 node 服务器，fork 下来直接打开 html 文件就能使用了。躲过了风头，服务器也重新开了，请戳这里=>[在线演示](https://api.leoyancey.com/currency_exchange/root.html)。

至于为什么当时想到了做一个汇率计算器，可能就是下图吧：

![哦](https://edge.yancey.app/beg/cc96791d-d215-47b3-8b75-24d4840008ee.jpeg)

以上、よろしく。

## PS

4 月 14 号把网站升级成了 HTTPS 协议，发现这个项目不能用了，查了一下资料，原来是浏览器默认阻止 https 协议请求 http 资源，项目中国家名称那个 api 使用的 http 协议，于是又找了一家，项目也恢复使用了。欢迎戳=>[汇率计算器在线演示](https://api.leoyancey.com/currency_exchange/root.html)。
