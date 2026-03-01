# Git仓库配置指南

本文档说明如何初始化Git仓库并将项目上传到GitHub。

## 前置要求

- 安装Git：[下载Git](https://git-scm.com/downloads)
- 拥有GitHub账号：[注册GitHub](https://github.com/signup)

## 第一步：配置Git

如果是第一次使用Git，需要配置用户信息：

```bash
# 配置用户名
git config --global user.name "Your Name"

# 配置邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --list
```

## 第二步：初始化本地仓库

在项目根目录执行：

```bash
# 初始化Git仓库
git init

# 查看当前状态
git status
```

## 第三步：添加文件到暂存区

```bash
# 添加所有文件
git add .

# 或者选择性添加文件
git add README.md
git add package.json
git add app/
git add api/
```

## 第四步：提交更改

```bash
# 创建首次提交
git commit -m "Initial commit: YIZ Gallery full-stack application"

# 查看提交历史
git log
```

## 第五步：创建GitHub仓库

### 方法1：通过GitHub网站

1. 访问 [GitHub](https://github.com)
2. 点击右上角的 "+" 按钮
3. 选择 "New repository"
4. 填写仓库信息：
   - **Repository name**: `yiz-gallery`（或你喜欢的名称）
   - **Description**: "Full-stack 3D image gallery with React, Three.js, and Vercel"
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
5. 点击 "Create repository"

### 方法2：使用GitHub CLI

```bash
# 安装GitHub CLI（如果还没有）
# macOS: brew install gh
# Windows: winget install GitHub.cli
# Linux: 参考 https://github.com/cli/cli#installation

# 登录GitHub
gh auth login

# 创建仓库
gh repo create yiz-gallery --public --source=. --remote=origin
```

## 第六步：连接远程仓库

如果使用方法1创建仓库，需要手动添加远程仓库：

```bash
# 添加远程仓库（替换为你的GitHub用户名）
git remote add origin https://github.com/your-username/yiz-gallery.git

# 验证远程仓库
git remote -v
```

## 第七步：推送到GitHub

```bash
# 推送到主分支
git push -u origin main

# 如果你的默认分支是master，使用：
# git push -u origin master

# 或者重命名分支为main：
# git branch -M main
# git push -u origin main
```

## 第八步：验证上传

1. 访问你的GitHub仓库页面
2. 确认所有文件已上传
3. 检查README.md是否正确显示

## .gitignore说明

项目已包含 `.gitignore` 文件，以下文件和目录不会被提交：

### 依赖和构建产物
- `node_modules/` - NPM依赖包
- `dist/` - 构建输出
- `build/` - 构建输出
- `.next/` - Next.js构建缓存

### 环境变量和敏感信息
- `.env` - 环境变量文件
- `.env.local` - 本地环境变量
- `.env.*.local` - 特定环境的本地变量

### 日志文件
- `*.log` - 所有日志文件
- `npm-debug.log*` - NPM调试日志

### 编辑器和IDE
- `.vscode/` - VS Code配置（除了扩展推荐）
- `.idea/` - JetBrains IDE配置
- `.DS_Store` - macOS系统文件

### 测试覆盖率
- `coverage/` - 测试覆盖率报告
- `.nyc_output` - NYC覆盖率数据

### 部署相关
- `.vercel` - Vercel部署配置

### 数据库
- `prisma/migrations/*_migration.sql` - 迁移SQL文件（保留迁移目录结构）

## 常用Git命令

### 查看状态

```bash
# 查看工作区状态
git status

# 查看修改内容
git diff

# 查看暂存区的修改
git diff --staged
```

### 提交更改

```bash
# 添加修改的文件
git add .

# 提交更改
git commit -m "描述你的更改"

# 修改最后一次提交
git commit --amend
```

### 推送和拉取

```bash
# 推送到远程仓库
git push

# 拉取远程更改
git pull

# 强制推送（谨慎使用）
git push --force
```

### 分支管理

```bash
# 查看所有分支
git branch -a

# 创建新分支
git branch feature-name

# 切换分支
git checkout feature-name

# 创建并切换到新分支
git checkout -b feature-name

# 合并分支
git merge feature-name

# 删除分支
git branch -d feature-name
```

### 撤销更改

```bash
# 撤销工作区的修改
git checkout -- filename

# 撤销暂存区的修改
git reset HEAD filename

# 回退到上一个提交
git reset --soft HEAD^

# 完全回退到上一个提交（危险）
git reset --hard HEAD^
```

### 查看历史

```bash
# 查看提交历史
git log

# 查看简洁的提交历史
git log --oneline

# 查看图形化的分支历史
git log --graph --oneline --all
```

## 协作开发工作流

### Fork工作流（开源项目）

1. Fork项目到你的GitHub账号
2. Clone你的Fork到本地
3. 创建功能分支
4. 提交更改
5. 推送到你的Fork
6. 创建Pull Request

### Feature分支工作流（团队项目）

1. 从main分支创建功能分支
   ```bash
   git checkout -b feature/new-feature
   ```

2. 开发并提交更改
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. 推送功能分支
   ```bash
   git push origin feature/new-feature
   ```

4. 在GitHub上创建Pull Request

5. 代码审查后合并到main分支

6. 删除功能分支
   ```bash
   git branch -d feature/new-feature
   git push origin --delete feature/new-feature
   ```

## 提交信息规范

使用清晰的提交信息有助于团队协作和版本管理。

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构代码
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
# 新功能
git commit -m "feat(upload): add drag and drop image upload"

# 修复bug
git commit -m "fix(auth): resolve JWT token expiration issue"

# 文档更新
git commit -m "docs(readme): update deployment instructions"

# 重构
git commit -m "refactor(api): simplify error handling logic"

# 测试
git commit -m "test(likes): add property tests for like persistence"
```

## 保护敏感信息

### 检查是否意外提交了敏感信息

```bash
# 搜索.env文件
git log --all --full-history -- .env

# 搜索包含密钥的提交
git log -S "API_KEY" --all
```

### 如果意外提交了敏感信息

1. **立即更换密钥**（最重要！）

2. **从历史中删除敏感文件**
   ```bash
   # 使用git filter-branch（旧方法）
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all

   # 或使用BFG Repo-Cleaner（推荐）
   # 下载BFG: https://rtyley.github.io/bfg-repo-cleaner/
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **强制推送**
   ```bash
   git push origin --force --all
   ```

## GitHub Actions集成

项目可以配置GitHub Actions实现自动化：

### 创建工作流文件

```bash
mkdir -p .github/workflows
```

### 示例：自动测试

创建 `.github/workflows/test.yml`：

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run property tests
      run: npm run test:property
```

## 常见问题

### 推送被拒绝

**问题：** `! [rejected] main -> main (fetch first)`

**解决方案：**
```bash
# 先拉取远程更改
git pull origin main

# 解决冲突（如果有）
# 然后推送
git push origin main
```

### 合并冲突

**问题：** 拉取时出现合并冲突

**解决方案：**
1. 打开冲突文件
2. 查找冲突标记：`<<<<<<<`, `=======`, `>>>>>>>`
3. 手动解决冲突
4. 删除冲突标记
5. 添加并提交：
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   ```

### 忘记添加.gitignore

**问题：** 已经提交了不应该提交的文件

**解决方案：**
```bash
# 从Git中删除但保留本地文件
git rm --cached filename

# 或删除整个目录
git rm -r --cached directory/

# 提交更改
git commit -m "Remove ignored files"
git push
```

### 修改最后一次提交

**问题：** 提交信息写错了或忘记添加文件

**解决方案：**
```bash
# 修改提交信息
git commit --amend -m "New commit message"

# 添加遗漏的文件
git add forgotten-file.txt
git commit --amend --no-edit

# 推送（如果已经推送过）
git push --force
```

## 最佳实践

1. **频繁提交**
   - 小步提交，每个提交只做一件事
   - 提交信息要清晰描述更改内容

2. **使用分支**
   - 不要直接在main分支开发
   - 为每个功能创建独立分支

3. **定期同步**
   - 经常拉取远程更改
   - 及时推送本地提交

4. **代码审查**
   - 使用Pull Request进行代码审查
   - 不要直接合并未审查的代码

5. **保护主分支**
   - 在GitHub设置中启用分支保护
   - 要求Pull Request审查后才能合并

6. **使用标签**
   - 为重要版本打标签
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

## 下一步

完成Git配置后，你可以：

1. 配置GitHub Actions实现CI/CD
2. 设置分支保护规则
3. 邀请协作者
4. 创建项目Wiki
5. 设置Issue模板
6. 配置GitHub Projects进行项目管理

## 参考资源

- [Git官方文档](https://git-scm.com/doc)
- [GitHub文档](https://docs.github.com)
- [Pro Git书籍](https://git-scm.com/book/zh/v2)
- [GitHub学习实验室](https://lab.github.com/)

祝你使用Git愉快！🎉
