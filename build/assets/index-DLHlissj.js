import{j as t,B as p,a_ as n}from"./index-DVp5JqhQ.js";import{u as e}from"./useQuery-BnKWdkYZ.js";import{g as m}from"./export-Ca9ub4eR.js";import{E as s,a as x}from"./export-items-oVHlIA6Y.js";import{P as d}from"./page-section-CneyTWNN.js";import{P as l}from"./printer-DAVO1lMe.js";import"./crud-BOVCz7ew.js";import"./main-B601asct.js";import"./skeleton-Dgy1lGFs.js";import"./loader-circle-Duyv1gj8.js";import"./createLucideIcon-BUeFl-qg.js";const g=`
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
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    transform: none !important;
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
  #export-print-area .export-print-hide { display: none !important; }
  #export-print-area .export-screen-footer { display: none !important; }
  #export-print-area .export-print-footer { display: table-row !important; }
  #export-print-area .export-print-note { padding-top: 4px !important; padding-bottom: 4px !important; }
  #export-print-area .export-print-signatures { padding-top: 6px !important; padding-bottom: 6px !important; }
  #export-print-area .export-print-sign-date { margin-bottom: 10px !important; }
  #export-print-area .export-print-sign-space { margin-top: 32px !important; }
  #export-print-area table { page-break-inside: auto; }
  #export-print-area tr { page-break-inside: avoid; page-break-after: auto; }
}
`;function b({id:r}){const i=e({queryKey:["export-detail",r],queryFn:()=>m(r),enabled:Number.isFinite(r)&&r>0}),a=i.data?.data??i.data;return t.jsx(d,{isLoading:i.isLoading,error:i.error,data:a,title:"Phiếu xuất kho",showBack:!0,actions:t.jsxs(p,{variant:"outline",size:"sm",onClick:()=>window.print(),children:[t.jsx(l,{className:"h-4 w-4 mr-1.5"}),"In phiếu"]}),children:o=>t.jsxs("div",{className:"max-w-5xl mx-auto print:m-0 print:max-w-none",children:[t.jsx("style",{children:g}),t.jsxs("div",{id:"export-print-area",className:"bg-white rounded-md shadow-sm border border-gray-200 p-5 print:shadow-none print:border-none print:p-0",children:[t.jsx(s,{data:o}),t.jsx(x,{data:o,items:o.items??[]})]})]})})}function N(){const{id:r}=n.useParams();return t.jsx(b,{id:Number(r)})}export{N as component};
