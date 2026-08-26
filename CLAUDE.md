# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

clsswjz-server 是个人财务管理系统（CLSSWJZ）的后端服务，NestJS + TypeORM + MySQL 实现。为 Flutter 移动端（clsswjz-gui）、Web 端（clsswjz-agent）提供 API。

## Gitea API 协作（PR / Release）

PR 创建/合并、Release 发布均可通过 Gitea API 自动完成（凭据从 `git credential fill` 读取，禁止硬编码）。操作步骤与 API 速查见 `docs/gitea_api_workflow.md`。

## 分支策略

- main 分支**严禁**直接开发新功能或修复 bug，仅允许项目配置、发版（版本号/CHANGELOG/tag）、文档/CI 更新
- 所有功能开发在 `feat/` 分支，bug 修复在 `fix/` 分支，通过 PR 合并到 main
- 分支 push 后可用 Gitea API 直接创建 PR 并合并（见上方文档）
