> 很早之前我就在用 Travis CI 做持续集成了，虽然只是停留在 zhuang bi 的阶段，但或多或少也保证了代码的提交质量。最近在写一个 《JavaScript API 全解析》系列的 Book，需要经常把文章部署到服务器上，手动部署实在是烦，索性花了一天时间研究了一下自动化部署。这篇文章是对 Travis CI 持续集成和自动化部署的总结，以飨社区。

## 前戏

Travis CI 目前有两个网站，一个是 travis-ci.com，另一个是 travis-ci.org. 前者用于企业级和私有仓库，后者用于开源的公有仓库。实际上 free plan 也可以使用 travis-ci.com，但优先级很低，跑个自动化动辄两个小时，因此我们使用 travis-ci.org.

首先打开 [Travis CI 官网](https://travis-ci.org/)，并用 GitHub 账号登录，授权后 Travis CI 会同步你的仓库信息。接下来把需要做自动化的工程授权给 Travis CI.

![授权仓库信息](https://user-gold-cdn.xitu.io/2019/3/28/169c2b195a2ade05?w=1022&h=602&f=jpeg&s=64354)

最好有一台 Linux 的服务器，我的是 Cent OS 7.6.x 64bit.

我们点开一个工程，再切到设置，可以看到在 push 代码和 PR 时都会触发持续集成，当然可以根据需求手动配置。

![设置页面](https://user-gold-cdn.xitu.io/2019/3/28/169c2b195a12e4c6?w=3076&h=566&f=jpeg&s=96025)

## 持续集成

为了让持续集成像那么回事儿，我们先在 master 上切一个 develop 分支，再在 develop 上切一个 featur/ci 分支。

接着我们再用 Jest 写几个测试用例，注意如果项目中没有测试脚本而 `.travis.yml` 文件里面包含 `yarn test`，自动化 **一定** 报错。关于 Jest 这里不详细说，只贴出几个示例代码。

```js
import * as utils from '../utils/util';

test('should get right date', () => {
  expect(utils.formatJSONDate('2019-03-10T04:15:40.629Z')).toBe(
    '2019-03-10 12:15:40',
  );
});

test('should get right string', () => {
  expect(utils.upperFirstLetter('AFTERNOON')).toBe('Afternoon');
  expect(utils.upperFirstLetter('YANCEY_LEO')).toBe('Yancey Leo');
});
```

然后我们在工程的根目录下新建一个文件 `.travis.yml`，并复制下面的代码。

```yml
language: node_js
node_js:
  - 8
branchs:
  only:
    - master
cache:
  directories:
    - node_modules
install:
  - yarn install
scripts:
  - yarn test
  - yarn build
```

简单解释一下，工程使用 Node.js 8.x，并且只在 `master` 分支有变动时触发 **自动化部署**（正常的提交、PR 都会正常走持续集成），接着将 node_modules 缓存起来（你懂的），最后安装依赖、跑测试脚本、在沙箱部署。

因此，理论上只要跑通这套流程，我们就可以放心的部署到真实环境了。

提交一下代码，并 pull request 到 develop 分支。在此过程中我们触发了 push 和 PR，所以会跑两个 CI。待到两个都成功跑完后，我们就可以放心的合到 develop 分支了。（这里我还做了代码质量检测，有兴趣可以戳 [Codacy](https://app.codacy.com)）

![跑 CI](https://user-gold-cdn.xitu.io/2019/3/28/169c2b195a31a02c?w=770&h=354&f=jpeg&s=63538)

最后我们回到 Travis CI 的官网，可以看到一套完整的构建流程：安装依赖 -> 测试 -> 沙箱部署

![CI 结果](https://user-gold-cdn.xitu.io/2019/3/28/169c2b195a4fe813?w=3010&h=1700&f=jpeg&s=322175)

## 持续部署

### 创建 rsa 对，并给予权限

首先登录你的服务器，一般来讲我们不会直接在 root 上操作，所以这里新增一个 caddy 的用户 。具体怎样在 Linux 新建用户请自行谷歌。

接下来 cd 到 \~/\.ssh，看看有没有一对 id_rsa 和 id_rsa\.pub，如果没有就用 `ssh-keygen` 生成。

给予 \.ssh 文件夹 700 权限，给予 \.ssh 里的文件 600 权限。（看下面这张图，你的文件夹里可能暂时没有 authorized_keys、 known_host、config 这三个文件，后面会说到。）

```
$ sudo chmod 700 ~/.ssh/

$ sudo chmod 600 ~/.ssh/*
```

![给予 .ssh 权限](https://user-gold-cdn.xitu.io/2019/3/28/169c2b195aa84a5d?w=1242&h=366&f=jpeg&s=122061)

### 将生成的公钥添加到受信列表

进入到 `.ssh` 文件夹里，执行下面的命令，可以看到公钥被添加到受信列表。

```
$ cat id_rsa.pub >> authorized_keys

$ cat authorized_keys
```

### 测试登录

在 `.ssh` 目录下创建一个文件 `config`，输入如下代码并保存。

```
Host test
HostName 当前服务器的IP
User 当前用户名
IdentitiesOnly yes
IdentityFile ~/.ssh/id_rsa
```

因为 `authorized_keys` 和 `config` 文件都是新增的，它们还没被赋予 600 权限，所以重新执行一遍 `sudo chmod 600 ~/.ssh/*`.

然后我们输入 `ssh test`，不出意外会重新登录 ssh。如果你的公钥从来没有被使用过，会提示 `Are you sure you want to continue connecting (yes/no)?` ，输入 yes 后也会正常重新登录，并且在`.ssh` 文件夹下还会生成一个 `known_hosts` 文件.

### 安装 Ruby

因为 Travis 客户端是用 Ruby 写的，所以我们得先安装 Ruby.

首先安装需要的依赖包：

```
$ yum install gcc-c++ patch readline readline-devel zlib zlib-devel \
   libyaml-devel libffi-devel openssl-devel make \
   bzip2 autoconf automake libtool bison iconv-devel sqlite-devel
```

接下来安装 RVM，并载入 RVM 环境。RVM 是 Ruby 的版本管理工具，类似于 Node 的 NVM.

```
$ gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3

$ \curl -sSL https://get.rvm.io | bash -s stable

# 载入 rvm 环境
$ source ~/.rvm/scripts/rvm
```

安装完之后输入 `rvm -v` 做下检查，如果有 rvm 1.29.1 (latest) by Michal Papis, Piotr Kuczynski, Wayne E. Seguin [https://rvm.io/] 的字样证明安装成功。

最后安装 Ruby，这里选择 v2.4.1 版本，安装需要一段时间，完成后记得将此版本设为默认。

```
$ rvm install 2.4.1

$ rvm 2.4.1 --default
```

执行一下 `ruby -v` 和 `gem -v`，如果和下图差不多证明安装成功。

![安装 ruby 成功](https://user-gold-cdn.xitu.io/2019/3/28/169c2b195aba267b?w=1542&h=204&f=jpeg&s=66085)

### 安装 Travis 客户端

执行下面的命令以安装 Travis 客户端。

```
$ gem install travis
```

安装完成后执行 `travis`，它会让你安装相应的 Shell, 输入 yes 即可。

![安装 shell](https://user-gold-cdn.xitu.io/2019/3/28/169c2b198fe3978b?w=1692&h=642&f=jpeg&s=161260)

### 配置免密登录

将你的工程克隆下来，并进入到工程目录，然后登录你的 GitHub 账号。

```
$ travis login --auto
```

![登录 GitHub](https://user-gold-cdn.xitu.io/2019/3/28/169c2b198fdfadaa?w=1840&h=404&f=jpeg&s=124861)

执行下面这句，它会利用服务器的私钥加密成一个叫做 `id_rsa.enc` 的文件，这个文件被用于 travis 登录你服务器的凭证，从而达到免密的目的。

```
$ travis encrypt-file ~/.ssh/id_rsa --add
```

![生成 id_rsa.enc 文件](https://user-gold-cdn.xitu.io/2019/3/28/169c2b199025a5e3?w=1682&h=364&f=jpeg&s=140289)

我们执行一下 `ll`，可以看到根目录下多出一个 `id_rsa.enc` 文件来，并且 `cat .travis.yml`，发现多出了 `before_install`.

为了更好地组织代码，我们在项目的根目录新建一个文件夹 `.travis`，然后将 `id_rsa.enc` 放到里面。

![添加了 before_install 钩子](https://user-gold-cdn.xitu.io/2019/3/28/169c2b19903f3f77?w=1720&h=760&f=jpeg&s=145700)

### 配置 after_success 钩子

在写这一小节之前，我们先看一看 Travis 的生命周期：

1. before_install 安装依赖前
2. install 安装依赖时
3. before_script 执行脚本前
4. script 执行脚本时
5. after_success 或 after_failure 执行脚本成功（失败）后
6. before_deploy 部署前
7. deploy 部署时
8. after_deploy 部署后
9. after_script 执行脚本后

因此 `after_success` 可用在成功通过测试脚本之后执行部署相关的脚本。当然细一点可以使用 deploy 相关的钩子，这里不做太复杂。

打开 `.travis.yml`文件，直接上全部代码。

```yml
language: node_js
sudo: true
node_js:
  - 8
branchs:
  only:
    - master
# 这里填写服务器的ip，若端口号不是22，后面要注明端口号
addons:
  ssh_known_hosts:
    - 你的服务器IP
cache:
  directories:
    - node_modules
before_install:
  # 因为我们把 id_rsa.enc 移到了.travis 文件夹下，所以 -in 后面要改成 .travis/id_rsa.enc
  # 其次，-out 后面自动生成的是 ~\/.ssh/id_rsa，要把 \ 去掉，否则会编译失败
  - openssl aes-256-cbc -K $encrypted_XXXXXXXXXXXX_key -iv $encrypted_XXXXXXXXXXXX_iv -in .travis/id_rsa.enc -out ~/.ssh/id_rsa -d
  # 开启 ssh-agent，即允许使用 ssh 命令
  - eval "$(ssh-agent -s)"
  # 给予 id_rsa 文件权限，避免警告
  - chmod 600 ~/.ssh/id_rsa
  # 将私钥添加到 ssh
  - ssh-add ~/.ssh/id_rsa
install:
  - yarn install
scripts:
  - yarn test
  - yarn build
after_success:
  # 登录服务器，执行部署脚本，其实最好把后面一串写成 shell 文件
  - ssh caddy@你的服务器IP -o StrictHostKeyChecking=no 'cd /var/www/jsapi/JavaScript-APIs-Set && git pull && yarn install && yarn build'
```

## 走一遍正式的流程

至此，搭建 Travis CI 持续集成和自动化部署就算完成了，可能不太严谨，但基本是这么一个思路。下面我们梳理一遍流程。

1. 我们先在 feature/ci 分支修改一段代码，提交分支，并 PR 到 develop，此时会运行两个 CI。当两个 CI 都跑通了，我们可以放心的 merge request 到 develop 分支。

2. 接下来让 develop PR 到 master，此时会运行两个 CI（一个是 develop 分支，一个是测试合并到 master 的 CI）。当两个 CI 都跑通了，我们可以放心的 merge request 到 master 分支。

3. merge request 之后会跑最后一个流程, 也就是自动部署，部署成功后线上代码就会更新了。

## 加入徽章

别忘了把 build passing 徽章添加到你的 README.md 文件中。

![badge](https://user-gold-cdn.xitu.io/2019/3/28/169c2b19aae7b810?w=652&h=306&f=jpeg&s=27223)

## 最后

不知道你有没有发现，Travis CI 支持 LGBT...

![LGBT](https://user-gold-cdn.xitu.io/2019/3/28/169c2b19ac17acc7?w=1308&h=210&f=jpeg&s=25865)

以上、よろしく。

## 参考

[How to Encrypt/Decrypt SSH Keys for Deployment](https://github.com/dwyl/learn-travis/blob/master/encrypted-ssh-keys-deployment.md#6-test-it-on-travis-ci)

[Travis-CI 自动化测试并部署至自己的 CentOS 服务器](https://juejin.im/post/5a9e1a5751882555712bd8e1#heading-9)

[CentOS 7 使用 rvm 安装 ruby 搭建 jekyll 环境](https://qizhanming.com/blog/2017/05/31/install-rvm-and-ruby-buid-jeklly-env-on-centos-7)
