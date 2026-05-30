import{j as t,B as p,aZ as n}from"./index-CD38V6hl.js";import{u as e}from"./useQuery-2a-jVohy.js";import{g as m}from"./export-CjClCS_r.js";import{E as s,a as d}from"./export-items-Carg4uiC.js";import{P as x}from"./page-section-Ds5PyJBq.js";import{P as g}from"./printer-1a26Z6Fq.js";import"./crud-DjVUIRQU.js";import"./main-WCFaJK6a.js";import"./skeleton-BddIogsk.js";import"./loader-circle-8mtjr-5T.js";import"./createLucideIcon-DOvkrFMK.js";const l=`
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }
  body * { visibility: hidden !important; }
  #export-print-area, #export-print-area * { visibility: visible !important; }
  #export-print-area {
    position: absolute !important;
    left: 50% !important;
    top: 0 !important;
    width: 200mm !important;
    max-width: 200mm !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    transform: translateX(-50%) !important;
    overflow: visible !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  #export-print-area .export-print-title { font-size: 17px !important; }
  #export-print-area .export-print-company { margin-bottom: 4px !important; }
  #export-print-area .export-print-info-lines { padding-top: 5px !important; padding-bottom: 5px !important; }
  #export-print-area table { font-size: 10px !important; line-height: 1.2 !important; }
  #export-print-area th,
  #export-print-area td { padding: 3px 5px !important; }
  #export-print-area .export-print-note { padding-top: 4px !important; padding-bottom: 4px !important; }
  #export-print-area .export-print-signatures { padding-top: 6px !important; padding-bottom: 6px !important; }
  #export-print-area .export-print-sign-date { margin-bottom: 10px !important; }
  #export-print-area .export-print-sign-space { margin-top: 32px !important; }
  #export-print-area table { page-break-inside: auto; }
  #export-print-area tr { page-break-inside: avoid; page-break-after: auto; }
  @page { size: A5 landscape; margin: 3mm; }
}
`;function b({id:r}){const i=e({queryKey:["export-detail",r],queryFn:()=>m(r),enabled:Number.isFinite(r)&&r>0}),o=i.data?.data??i.data;return t.jsx(x,{isLoading:i.isLoading,error:i.error,data:o,title:"Phiếu xuất kho",showBack:!0,actions:t.jsxs(p,{variant:"outline",size:"sm",onClick:()=>window.print(),children:[t.jsx(g,{className:"h-4 w-4 mr-1.5"}),"In phiếu"]}),children:a=>t.jsxs("div",{className:"max-w-5xl mx-auto print:m-0 print:max-w-none",children:[t.jsx("style",{children:l}),t.jsxs("div",{id:"export-print-area",className:"bg-white rounded-md shadow-sm border border-gray-200 p-5 print:shadow-none print:border-none print:p-0",children:[t.jsx(s,{data:a}),t.jsx(d,{data:a,items:a.items??[]})]})]})})}function N(){const{id:r}=n.useParams();return t.jsx(b,{id:Number(r)})}export{N as component};
