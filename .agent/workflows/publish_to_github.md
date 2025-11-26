---
description: How to publish this project to GitHub
---

# Publish to GitHub

Since Git is not currently installed or recognized on your system, you'll need to install it first.

## 1. Install Git
1.  Download Git for Windows: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2.  Run the installer. You can use the default settings.
3.  **Important**: After installing, you may need to restart your terminal or VS Code for the `git` command to be recognized.

## 2. Initialize Git Repository
Once Git is installed, run the following commands in your terminal (at the project root `c:\Users\Joab\Desktop\studio-main`):

```powershell
# Initialize a new git repository
git init

# Add all files to staging
git add .

# Commit the files
git commit -m "Initial commit"
```

## 3. Create Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  Enter a repository name (e.g., `studio-main`).
3.  Click **Create repository**.

## 4. Push to GitHub
Copy the commands shown on the GitHub page under "…or push an existing repository from the command line", which will look like this:

```powershell
# Replace <YOUR_USERNAME> with your actual GitHub username
git remote add origin https://github.com/<YOUR_USERNAME>/studio-main.git
git branch -M main
git push -u origin main
```

## 5. Verify
Refresh your GitHub repository page to see your code.
