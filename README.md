# OSG Homepage

**[🔗 Live Demo →](https://lee-hansol-cy.github.io/osg-homepage/)**

OSG 메인페이지 UI System — top bar 캡슐 내비게이션, 구매/장바구니 버튼 컴포넌트 세트.

## UI System

`UI System/260723/` 디렉토리에 React + Vite + Tailwind + @lisse/react 기반 컴포넌트가 있다.

```bash
cd "UI System/260723"
pnpm install
pnpm dev        # 로컬 개발 서버
pnpm build      # 프로덕션 빌드 → dist/
```

## 배포

`gh-pages` 브랜치에 빌드 결과물이 올라가 있으며, GitHub Pages에서 자동 서빙된다.
재배포 시:

```bash
cd "UI System/260723"
pnpm build
# dist/ 내용을 gh-pages 브랜치에 force push
```
