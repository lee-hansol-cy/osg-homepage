# OSG UI System: 구매 및 장바구니 버튼 컴포넌트

이 export는 OSG Homepage에서 사용하는 구매하기 및 장바구니 버튼 컴포넌트 세트다.

- 구매하기 버튼 컴포넌트
- 장바구니 버튼 컴포넌트
- 각 버튼의 관련 상태와 시각적 변형
- 메인페이지 top bar 캡슐 컴포넌트 (`src/app/components/top-bar.tsx`, Figma OFFSET GARAGE node 667:106)

AI가 이 자산을 사용할 때는 새로운 구매/장바구니 버튼을 만들기 전에 이 컴포넌트와 기존 UI System 요소를 먼저 재활용한다. 요구사항이 기존 컴포넌트로 해결되지 않는 경우에만 새 요소를 추가하고, 그 이유를 기록한다.

top bar 캡슐은 Figma 디자인의 좌표/색상/효과를 그대로 매핑한다. 로고(`src/assets/osg-logo-topbar.png`)는 Figma에서 4x로 내보낸 벡터 렌더이고, OSG Capsules 폰트는 `public/fonts/`에서 `@font-face`로 로드한다.


  # Responsive component set creation

  This is a code bundle for Responsive component set creation. The original project is available at https://www.figma.com/design/3EIyi2vf4JewHVRIyT8nCP/Responsive-component-set-creation.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
