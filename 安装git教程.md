# Git 安装教程

Git 是一个分布式版本控制系统，广泛用于软件开发。本教程将介绍在不同操作系统上安装 Git 的方法。

## 目录
- [Windows 安装](#windows-安装)
- [macOS 安装](#macos-安装)
- [Linux 安装](#linux-安装)
- [验证安装](#验证安装)
- [更新环境变量](#更新环境变量)
- [配置 Git](#配置-git)

## Windows 安装

### 方法一：官方安装包（推荐）

1. 访问 Git 官方网站：https://git-scm.com/download/win
2. 下载适合您系统的安装包（32位或64位）
3. 运行下载的 `.exe` 文件
4. 按照安装向导的提示进行安装
5. 安装完成后，打开命令提示符或 PowerShell，输入 `git --version` 验证安装

### 方法二：使用 Chocolatey

如果您已安装 Chocolatey 包管理器：

```powershell
choco install git -y
# 刷新环境变量
refreshenv
```

如果您尚未安装 Chocolatey，可以按以下步骤安装：

```powershell
# 设置允许当前用户运行脚本和启用 TLS 1.2
Set-ExecutionPolicy Bypass -Scope CurrentUser -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
# 安装 Chocolatey
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
# 刷新环境变量
$env:Path += ";C:\ProgramData\chocolatey\bin"
# 安装 Git
choco install git -y
# 刷新环境变量
$env:PATH += ";C:\Program Files\Git\cmd"
```

## macOS 安装

### 方法一：使用 Homebrew（推荐）

如果您已安装 Homebrew：

```bash
brew install git
```

如果您尚未安装 Homebrew，可以按以下步骤安装：

```bash
# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装完成后，安装 Git
brew install git
```

### 方法二：官方安装包

1. 访问 https://git-scm.com/download/mac
2. 下载并安装官方安装包

## Linux 安装

### Ubuntu/Debian 系统

```bash
# 更新包列表
sudo apt update

# 安装 Git
sudo apt install git -y
```

## 验证安装

安装完成后，验证 Git 是否正确安装：

```bash
git --version
```

如果安装成功，您将看到类似以下的输出：
```
git version 2.40.0
```

## 常见问题

### 1. 权限问题
如果在 Linux/macOS 上遇到权限问题，可能需要使用 `sudo`：
```bash
sudo apt install git  # Ubuntu/Debian
```

### 2. 网络问题
如果在下载过程中遇到网络问题，可以尝试：
- 使用镜像源
- 配置代理
- 使用 VPN
- 更换网络环境

### 3. 版本过旧
如果系统包管理器提供的 Git 版本过旧，建议：
- 从源码编译安装
- 使用官方安装包
- 添加第三方软件源

### 4. Windows 安装问题
- 确保以管理员身份运行安装程序
- 如果使用包管理器，确保 PowerShell 执行策略允许运行脚本
- 安装完成后重启命令行工具
- 检查环境变量是否正确设置

### 5. 环境变量问题
- 如果 `git` 命令无法识别，检查 PATH 环境变量
- 确保 Git 安装路径已添加到系统 PATH 中
- 重启终端或命令行工具使环境变量生效

## 参考资源

- [Git 官方网站](https://git-scm.com/)
- [Git 官方文档](https://git-scm.com/doc)
- [Git 教程](https://git-scm.com/book/zh/v2)
- [GitHub 帮助文档](https://docs.github.com/cn)
- [Git 中文手册](https://git-scm.com/book/zh/v2)

---

