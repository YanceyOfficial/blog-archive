# Git 学习笔记

![logo](https://static.yancey.app/social.jpg)

> 实习半个月有余，因为公司做电商相关，收获还是超级大的。最近周末一直忙着编论文，博客一直没更新实为惭愧。鄙人对 Git 多人协作那一块儿了解不多，赶紧恶补一下。文章以廖雪峰聚聚的教程为蓝本，加之自身理解。

## 全局配置

安装完 Git 后要给自己的机器做一下标识，便于多人协作时互相区分，一般设为全局即可，命令如下所示：

```
$ git config --global user.name "输入一个用户名"
$ git config --global user.email "输入一个邮箱"




```

查看本机用户名、邮箱配置：

```
$ git config user.name
$ git config user.email




```

## 创建版本库

在合适的文件夹（本文新建一个名为 learnGit 的文件夹）下执行下句，Git 仓库就创建好了，其中所有的跟踪信息被保存到隐藏文件夹.git`中，_注意这个文件夹里面的内容不要乱动吼_。

```
$ git init




```

随后我向 learnGit 文件夹中添加一个名为 HotKeys 的 txt 文件\*（注：本文均以这个文件为例，这里面主要记录一些 Mac 常用快捷键）\*，然而此时 Git 并不能确定你是否要将这个文件添加到版本库，执行`git status`，看下图：

![Git提示你将文件添加到版本库](https://static.yancey.app/c54c9dda-3e05-4091-a187-b17ff3c2d9a1.jpg)

因此执行下面两句：

```
$ git add HotKeys.txt
$ git commit -m "增加一个名字叫做HotKeys的文本文件"




```

其中 add 命令是告诉 Git 本次要添加哪些文件，可以一次性添加多个，中间用**空格**隔开即可；commit 命令用于告诉 Git 本次提交的说明，因此言简意赅的摘要尤为重要。

此时再次执行一遍`git status`，看下图，嗯，已经洗白白了：

![已经没有待提交的文件了](https://static.yancey.app/1e7cc831-5e1f-4739-95d8-7f0efb4ea6e3.jpg)

## 时光机穿梭

我向 HotKeys 文件添加几行文字：

```
截图工具：

区域截图：shift+control+a
录屏：shift+control+r




```

执行一遍`git status`，它丫告诉我们文件已被修改，但还没被提交。

![文件已被修改，但还没被提交](https://static.yancey.app/543a6ec0-a6e9-45ac-ad8d-566f91f1fd56.jpg)

我们可以通过`git diff`来查看我们到底修改了什么。好吧，增加了 5 行文字：

![看看我们修改了什么](https://static.yancey.app/0c683427-1940-4486-a59f-c40239ef168a.jpg)

然后，我们再次执行一遍 add 和 commit 命令：

```
$ git add HotKeys.txt
$ git commit -m "增加关于截图工具的快捷键"


```

再次执行一遍`git status`，看下图，嗯，已经洗白白了：

![已经没有待提交的文件了](https://static.yancey.app/1e7cc831-5e1f-4739-95d8-7f0efb4ea6e3.jpg)

### 版本回退

通过`git log`可以查看当前分支所有日志：

![所有日志](https://static.yancey.app/4da268c2-feaa-4be4-bb3a-34f4cb1ab037.jpg)

当然使用`git log --pretty=oneline`命令可以美化 log 输出，话说也不见得美化啊喂！！！

```
c334b0c2656ebd588696711c05b73520fb3f10b5 (HEAD -> master) 增加关于截图工具的快捷键

d9cdc6fede4c82c1c488494fd1e64c4cb1abbd8b 增加一个名字叫做HotKeys的文本文件




```

在 Git 中，用`HEAD`表示当前版本，那么上一个版本就是 `HEAD^`，上上一个版本就是`HEAD^^`，当然要想回溯到第前 100 个版本，写 100 个^显然太牙败了，所以可以写成 `HEAD~100`

下面我们回到上一个版本，也就是“增加一个名字叫做 HotKeys 的文本文件”那一版：

```
$ git reset --hard HEAD^


```

![一觉回到解放前](https://static.yancey.app/02501c3a-8c8b-4cf0-833a-6e037e64e2ef.jpg)

我们使用`cat HotKeys.txt`打开这个文件，发现新增的**关于截图快捷键**那部分给消失了，说明我们成功会退到了上一版本。

但是蛋疼的是，当我们再次输入`git log`时，发现最新的那条记录已经木有了，而且你在磁盘打开 HotKeys 这个文件，发现新增的那五行也消失了卧槽。苦呀西不可说。

莫方，办法还是有的，往上看两张图，能看到"增加关于截图工具的快捷键"那个 commit id，就是**c334b0c2656ebd588696711c05b73520fb3f10b5**，依靠这串 id，我们就可以回到未来了，Let's go.

```
git reset --hard c334b0c




```

ok, 查看一下`git log`和文件，我胡汉三又回来了，注意这个 commit id 可以不用写全，写个前几位就行，Git 帮你匹配。

但是另一个问题粗线了，要是找不着 commit id 怎么办呢？莫方，下面这个命令用来记录你的每一次命令：

```
$ git reflog


```

![命令日志](https://static.yancey.app/6689ed54-2c87-4c51-8e69-e105ce59ed31.jpg)

酱紫，你就找到所对应的版本号了。

### 工作区和暂存区

![工作区和版本库](https://static.yancey.app/02de5473-0e0a-4e7d-9d3e-aa6d4ce5514f.jpeg)

这里盗用廖雪峰聚聚的一张图，所谓工作区(Working Directory)，就是 learnGit 文件夹下**我们自己编写的那一部分**，而版本库\(Repository\)就是那个隐藏文件\*\*\.git\*\*了。

Git 的版本库里存了很多东西，其中最重要的就是称为 stage（或者叫 index）的暂存区，还有 Git 为我们自动创建的第一个分支 master，以及指向 master 的一个指针叫 HEAD。

`git add`命令实际上就是把要提交的所有修改放到暂存区（Stage）。`git commit`一次性把暂存区的所有修改提交到分支。

### 管理修改

一言以蔽之，如果不 add 到暂存区，那就不会加入到 commit 中，因此 add 命令要和 commit 命令同时食用。

### 撤销修改

突然你诗性大发，在 HotKeys 文件里写了首诗：

```
鸣神の　少しとよみて　さし昙り　雨も降らんか　君を留めん
鸣神の　少しとよみて　降らずとも　我は止まらん　妹し留めば




```

哈哈哈蛇精病啊有木有。咳咳，不过还是要删掉这一段的：

\$ git checkout -- Hotkeys.txt

这句指令仅限于两种情况：

- 你在写了这两句后，没有使用`git add`命令，也就是还没把最新修改 add 到暂存区，执行切克闹后它将退回到当前版本库；
- 你在写了这两句之前已经使用了`git add`命令，但没使用`git commit`命令，也就是已经把这两句之前的修改 add 到了暂存区，但没把修改提交到分支，执行切克闹后它就回到添加到暂存区后的状态。

当然上面说了 add 命令要和 commit 命令同时食用，所以第二种情况基本上也不会出现。

然鹅，你在写了这两句话之后使用了`git add`命令，但突然幡然醒悟，立即删掉了打了一半的`git commit`，那么 reset 一下就好了。

```
$ git reset HEAD HotKeys.txt




```

### 删除文件

一般我们就直接右键把文件删除了，但是 Git 会把删除理解为修改，我们尝试将 HotKeys 文件丢弃到废纸篓，输入命令`git status`，发现如下图所示：

![移除文件](https://static.yancey.app/0cdf4afe-64bc-487f-b62c-6fdb5c210fd6.jpg)

假设你确实要删除此文件，那么执行下面两句：

```
$ git rm HotKeys.txt
$ git commit -m "移除HotKeys文件"




```

但如果是误删，你也可以轻松找回：

\$ git checkout -- HotKeys.txt

## 远程仓库

由于本地 Git 仓库和 GitHub 仓库之间的传输是通过 SSH 加密的，所以创建 SSH Key：

```
$ ssh-keygen -t rsa -C "你的电子邮箱"




```

Mac OS 中，在用户主目录里找到`.ssh`这个隐藏文件夹，点进去可以找到刚刚生成的`id_rsa`和`id_rsa.pub`两个文件。这两个就是 SSH Key 的秘钥对，`id_rsa`是私钥，不能泄露出去；`id_rsa.pub`是公钥，可以放心地告诉任何人。

然后在 GitHub 中绑定生成的公钥即可，当然如果是公司自己搭的 Git 服务器，那就把密钥告诉服务器管理员即可，他会把你的密钥绑定到 Git 服务器上。

### 添加远程库

这时本地和远端就可以进行通信了，我在我的 GitHub 建立一个名字叫 learnGit 的远端仓库，然后在本地的 learnGit 文件夹下运行如下命令：

```
$ git remote add origin git@github.com:yancey_leo/learnGit.git




```

这样，本地仓库就和远端仓库关联上了，origin 就是远程库的名字，这是 Git 默认的叫法，一般就用这个名字即可。

### 将本地仓库推送到远程

下面将本地的 master 分支推送到远端，下面这个命令是第一次推送，需要加\*\*\-u\*\*：

```
$ git push -u origin master




```

以后推送分支时就不需要加\*\*\-u\*\*了，下面是将本地的 master 分支推送到远端的 master 分支，实际就是本地把远端的给覆盖掉了：

```
$ git push origin master




```

### 克隆现有远端数据库

```
$ git clone git@github.com:yancey_leo/learnGit.git




```

当然 URL 不仅仅限于形如 github.com:yancey_leo 的这种形式，很多公司自己搭 Git，会走 https 等。

### 从远程拉取最新更新

当别人在远端更新了提交，你需要把最新的更新拉下来：

```
$ git pull




```

## 分支管理

一开始只有 master 分支，它是一条线，HEAD 指向最新的提交的那一版本，每次提交，master 分支都会向前移动一步，随着不断提交，master 分支的线也越来越长：

为了独立开发，我们在从远程拉取仓库后，切出一个分支，比如命名为 loginPage.

```
$ git checkout -b loginPage




```

上句实际执行了两句指令，分别创建分支和切换到被创建的这条分支:

```
$ git branch loginPage
$ git checkout loginPage




```

当我们创建并指向 loginPage 分支时，Git 新建了一个指针叫 loginPage，指向 master 相同的提交，再把 HEAD 指向 loginPage，就表示当前分支在 loginPage 上了。

通过命令`git branch`查看**本地**所有分支，其中前面标有**星号**的是当前分支；通过命令`git branch -a`查看**本地和远端**所有分支。

从现在开始，对工作区的修改和提交就是针对 loginPage 分支了，比如新提交一次后，loginPage 指针往前移动一步，而 master 指针不变。当 loginPage 分支的工作完成了，那就可以合并到 master 分支了，具体操作有两步：**先切到 master 分支，再将 loginPage 分支合并**:

```
$ git checkout master
$ git merge loginPage




```

此时 master 的内容就和 loginPage 的一样了，然后就可以删除 loginPage 分支了：

```
$ git branch -d loginPage




```

当然有时会显示并没有完全转移，如下图所示，如果确定没什么冲突，那就直接`git branch -D loginPage`好了。

![没有完全转移](https://static.yancey.app/8738933d-3ee5-4e8d-a0b4-a35960d193a0.jpg)
注意：`git branch -d loginPage`这个命令是删除本地的 loginPage，若远端还保留着这个分支，用下面这个命令：

```
$ git push origin :loginPage




```

做一个简单梳理，多人协作中基本就是这些命令，分支名以“loginPage”为例：

```
查看本地分支：git branch

查看远程分支：git branch -a

创建分支：git branch loginPage

切换分支：git checkout loginPage

创建+切换分支：git checkout -b loginPage

合并分支到master： ① git checkout master  ② git merge loginPage

将某分支推送到远端：git push origin loginPage

删除本地某分支：git branch -d loginPage

删除远端某分支：git push origin :loginPage




```

## 忽略特殊文件

在 Git 工作区的根目录下创建一个特殊的`.gitignore`文件，比如我现在用的 IDE 是 WebStorm，这货会自动在工程下生成隐藏的配置文件夹`.idea`。所以我可以创建这个名字叫做`.gitignore`的文件，用 Atom 打开，键入：

```
.idea
DS_Store
...




```

## 一些常见场景

### 当别人把你远端的分支删除了

当别人在你不知情的情况下把你远端的分支给删除了，你执行`git branch -a`会发现这个分支还在远端显示着。当你想删除这个远端分支时，执行`git push origin :taggoods2`就会报错：

![远端的分支被别人删除](https://static.yancey.app/d89a9d94-b126-4555-b97e-5640443c5e6d.jpg)

_注意这是我工作中遇到的问题，所以关键地方打了码_。

因此需要删除本地跟踪：

```
$ git branch -dr origin/taggoods2




```

这个**--dr**是**--delete --remotes**的缩写，若你不怕麻烦，下面的代码同等效益：

```
$ git branch --delete --remotes origin/taggoods2



```
