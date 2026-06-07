
<table align="center">
  <p align="center">
  <img src="./docs/aruka_logo.svg" width="80%" alt="aruka_logo">
  </p>
  <tr>
    <td>
      <img src="./docs/aruka_home.png" width="600" alt="aruka_pc"/>
    </td>
    <td>
      <img src="./docs/aruka_phone.jpeg" width="164" alt="aruka_phone"/>
    </td>
  </tr>
</table>


<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white">
</p>


<p align="center">
  <a href="https://aruka.app">
    <img src="https://img.shields.io/badge/Demo-Live-success?style=for-the-badge">
  </a>
</p>

> [!NOTE]
> 現在は複数端末間でのデータ同期を実現するため、Googleログインを必須としています。<br>
> 今後はログイン不要で利用できる範囲を拡大する予定です。


---

## 概要

aruka? は、「あれ、この本持ってたっけ？」をすぐ確認できる書籍管理アプリ。
自分が持っている本を登録・検索して、書店やオンラインで本を買う前に重複購入を防ぐこと

バーコードを読み取るだけで所持状況を確認でき、外出先でも簡単に利用できます。

---

## 制作背景

### 課題

- 何巻まで持っているかわからなくなる
- 同じ本を重複購入してしまう
- 外出先で所持状況を確認しづらい

### 解決方法

- ISBNバーコードによる簡単登録
- 所持状況の一覧管理
- スマートフォンからいつでも確認可能


## 技術スタック・選定理由

### Next.js

フロントエンドとバックエンドを同一プロジェクトで管理できるため採用しました。<br>
個人開発では開発速度を重視したかったため、API Routesを利用できるNext.jsを選択しました。

### TypeScript

型安全性を確保し、実装時のミスを減らすため採用しました。

### ZXing

ISBNバーコードを読み取るために採用しました。
ユーザーが手入力することなく書籍を登録できるようにしています。

### Supabase

個人開発でも導入コストが低いため採用しました。


### Clerk

---
