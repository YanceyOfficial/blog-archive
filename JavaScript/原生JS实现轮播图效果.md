# 原生 JS 实现轮播图效果

![logo](https://edge.yancey.app/beg/9496879-776d40aacdf8d03e.png)

> 如果爱情能跟用原生 JS 写一个轮播图那么简单该多好啊。嗯，虽然也不简单。虽然很多优秀的第三方轮播图插件（如 Swiper）在业界广受好评，但掌握轮播图的原理还是尤为重要的。

## 说明

- 整个轮播图是跟着 x 课网的视频做的，放上[链接地址](https://www.imooc.com/learn/18)；

- 图片来自 QQ 音乐，大小为 1080\*482;

- 若有侵权，~~contact me~~ 话说您讯不就是“%&\*（&#（￥&#）{：@#“%；

- 我在原有的基础上增加了左下角动态显示图片 alt 里的值；

- 目前只能放 5 张图片，图片扩充后期再改吧，心情不好；

- 视频里有个不太好的地方，就是在图片显示第一张时，我 onmouseover 第五张对应的小圆圈，它会从第一张一直向右划四张来得到第五张图，反之亦然。我做了改动，当触发上述事件时，是直接向左划一张来得到第五张图，反之亦然。

## HTML

```html
<header>
  <div id="banner">
    <div id="banner-img" style="left:-1080px">
      <!--头部放第五张图-->
      <a href="../blog/index.html"
        ><img src="images/222417.jpg" alt="AI·爱"
      /></a>
      <a href="../blog/index.html"
        ><img src="images/151139.jpg" alt="绿钻豪华版"
      /></a>
      <a href="../blog/index.html"
        ><img src="images/221876.jpg" alt="MIXNINE"
      /></a>
      <a href="../blog/index.html"
        ><img src="images/222089.jpg" alt="偷故事的人"
      /></a>
      <a href="../blog/index.html"
        ><img src="images/222353.jpg" alt="红蔷薇"
      /></a>
      <a href="../blog/index.html"
        ><img src="images/222417.jpg" alt="AI·爱"
      /></a>
      <!--尾部放第一张图-->
      <a href="../blog/index.html"
        ><img src="images/151139.jpg" alt="绿钻豪华版"
      /></a>
    </div>
    <!--左右两个箭头，记得包在a标签里-->
    <a href="javascript:" id="arrow-prev" class="arrow"></a>
    <a href="javascript:" id="arrow-next" class="arrow"></a>
    <!--左下角显示图片alt的值->
    <span id="img-info"></span>
    <!--底部的遮罩，可以不用->
    <div id="mask"></div>
    <!--小圆圈 用border-radius:50%足够了-->
    <ul id="slide-switch-circle">
      <li class="circle-1"></li>
      <li class="circle-2"></li>
      <li class="circle-3"></li>
      <li class="circle-4"></li>
      <li class="circle-5"></li>
    </ul>
  </div>
</header>
```

- 我看到有的地方把图片列表放到 ul li 中，这个确实更加合理一些。
- **敲重点：首尾分别放置图片 list 的第五张和第一张，目的是实现无缝循环**
- 在#banner-img 中写一个内联的 left: -1080px，因为我们把第五张图放到了图片列表的第一个位置，因此 left: -1080px 是得到真正的第一张图片

## CSS

```css
* {
  padding: 0;
  margin: 0;
  list-style-type: none;
  text-decoration: none;
}

#banner {
  width: 1080px;
  height: 482px;
  position: relative;
  margin: 100px auto;
  overflow: hidden;
}

#banner-img {
  width: 7560px;
  height: 482px;
  position: absolute;
  display: block;
  z-index: 1;
  left: -1080px;
}

#banner-img a img {
  float: left;
}

#mask {
  position: absolute;
  width: 1080px;
  height: 40px;
  top: 392px;
  background: #000;
  opacity: 0.3;
  z-index: 2;
}

#img-info {
  position: absolute;
  font-size: 20px;
  top: 401px;
  left: 30px;
  font-family: Consolas, sans-serif;
  color: #fff;
  z-index: 2;
}

#arrow-prev,
#arrow-next {
  position: absolute;
  width: 80px;
  height: 140px;
  top: 131px;
  z-index: 2;
}

#arrow-prev {
  left: -80px;
  transition: 500ms left ease;

  background: rgba(0, 0, 0, 0.3) url("../images/left40.png") no-repeat 28px 50px;
}

#arrow-next {
  right: -80px;
  transition: 500ms right ease;
  background: rgba(0, 0, 0, 0.3) url("../images/right40.png") no-repeat 28px 50px;
}

#banner:hover #arrow-prev {
  display: block;
  left: 0;
  transition: 500ms left ease;
}

#banner:hover #arrow-next {
  display: block;
  right: 0;
  transition: 500ms right ease;
}

#arrow-prev:hover {
  background: rgba(0, 0, 0, 0.5) url("../images/left80.png") no-repeat 28px 50px;
}

#arrow-next:hover {
  background: rgba(0, 0, 0, 0.5) url("../images/right80.png") no-repeat 28px 50px;
}

#slide-switch-circle {
  position: absolute;
  top: 410px;
  left: 470px;
  z-index: 3;
}

#slide-switch-circle li {
  height: 15px;
  width: 15px;
  background: #ccc;
  opacity: 0.3;
  border-radius: 50%;
  float: left;
  margin-left: 10px;
}
```

- CSS 中四张背景图是在酷我音乐的网站首页拿的
- 将图片设为左浮动，并把 img 标签设为 block
- banner 的 width 设为 1080px
- 将#banner-img 的宽度设为 5\*1080 = 7560px，同时写一个 left: -1080px，后面要把它当做常量来用；
- 要体现出各个组件的层次感，设置绝对位置和 z-index 权值
- 14 号做了一次修改，箭头加入了渐入渐出效果

## JS

```ts
window.onload = function () {
  let banner = document.getElementById("banner");
  let img_list = document.getElementById("banner-img");
  let arrow_prev = document.getElementById("arrow-prev");
  let arrow_next = document.getElementById("arrow-next");
  let switch_circle = document.getElementById("slide-switch-circle").children;
  let img_info = document.getElementById("img-info");
  //初始化第一个圆圈是亮的
  switch_circle[0].style.opacity = "1";
  //初始化第一个img_info的名字
  img_info.innerHTML = document
    .getElementsByTagName("img")[1]
    .getAttribute("alt");
  //1080 获取图片宽度
  let img_width = parseInt(window.getComputedStyle(banner, null).width);
  //5 获取图片个数 记得减去2
  let img_num = img_list.children.length - 2;

  //初始化索引值
  let index = 1;
  //当快速点击左右箭头或快速鼠标滑动底部小圆圈快造成卡帧
  let animated = false;
  let timer;

  //动画效果
  function animate(offset, time, interval) {
    //这边呼应下面小圆圈那个部分
    //假设图片显示的是第一张，你又用鼠标触发第一个小圆圈
    //直接获得偏移量是0，就不会执行下面动画的代码了
    if (offset === 0) {
      return;
    }
    //动画不动时animated设为true
    //再去点击左右箭头或者小圆圈时才会继续移动
    //否则当为false时，不允许执行动画、箭头点击、鼠标移入小圆圈这三个函数的代码
    animated = true;
    let current_left = parseInt(img_list.style.left) + offset;
    let speed = offset / (time / interval);

    let go = function () {
      //判断图片是否停止了下来
      if (
        (speed < 0 && parseInt(img_list.style.left) > current_left) ||
        (speed > 0 && parseInt(img_list.style.left) < current_left)
      ) {
        img_list.style.left = parseInt(img_list.style.left) + speed + "px";
        setTimeout(go, interval);
      } else {
        img_list.style.left = current_left + "px";
        //处理在第一张和第五章时 将偏移量重置
        if (current_left > -img_width) {
          img_list.style.left = -(img_width * img_num) + "px";
        } else if (current_left < -(img_width * img_num)) {
          img_list.style.left = -img_width + "px";
        }
        animated = false;
      }
    };
    go();
  }

  //自动轮播 每三秒自动执行右箭头点击事件
  function autoPlay() {
    timer = setInterval(function () {
      arrow_next.onclick();
    }, 3000);
  }

  //停止轮播
  function stopPlay() {
    clearInterval(timer);
  }

  //
  function switchCircle() {
    for (let i = 0; i < switch_circle.length; i++) {
      //如果不加判断 在苏表离开某个底部小圆圈时，它的透明度不会恢复0.3
      if (switch_circle[i].style.opacity === "1") {
        switch_circle[i].style.opacity = "0.3";
        break;
      }
    }
    //给onmouseover的小圆圈透明度变1
    switch_circle[index - 1].style.opacity = "1";
  }

  //左下角填充图片alt里的文字
  function showInfo(index) {
    //这边直接获取img标签是为了偷懒 更合理的方法不写了
    img_info.innerHTML = document
      .getElementsByTagName("img")
      [index].getAttribute("alt");
  }

  //点击左箭头
  arrow_prev.onclick = function () {
    //防止卡帧
    if (animated) {
      return;
    }

    if (index === 1) {
      index = img_num;
    } else {
      index -= 1;
    }
    //增加动画效果
    animate(img_width, 600, 10);
    //小圆圈变化
    switchCircle();
    //文字变化
    showInfo(index);
  };

  //点击右箭头
  arrow_next.onclick = function () {
    //防止卡帧
    if (animated) {
      return;
    }
    if (index === img_num) {
      index = 1;
    } else {
      index += 1;
    }
    animate(-img_width, 600, 10);
    switchCircle();
    showInfo(index);
  };

  //鼠标移入小圆圈事件
  for (let i = 0; i < switch_circle.length; i++) {
    switch_circle[i].onmouseover = function () {
      //防止卡帧
      if (animated) {
        return;
      }
      //假设图片显示的是第一张，你又用鼠标触发第一个小圆圈，加了如下判断就不会执行下面计算偏移量之类的的语句，提高性能
      if (this.style.opacity === "1") {
        return;
      }
      //给小圆圈的的每个li加上了class，获取其中的数字
      let click_index = parseInt(this.getAttribute("class").slice(-1));
      //偏移量计算
      let offset = -img_width * (click_index - index);
      //这里就是我开篇所说的 原视频在从第一张移入最后一张的问题
      //加上下述判断，就可以实现从第一张移入最后一张是向左移动一张的效果
      if (offset === -((img_num - 1) * img_width)) {
        offset = img_width;
      } else if (offset === (img_num - 1) * img_width) {
        offset = -img_width;
      }
      animate(offset, 600, 10);
      index = click_index;
      switchCircle();
      showInfo(index);
    };
  }

  //当鼠标移出图片的div之外停止自动轮播
  img_list.onmouseover = stopPlay;
  //当鼠标移出图片的div之外开始自动轮播
  img_list.onmouseout = autoPlay;
  autoPlay();
};
```

以上、よろしく。
