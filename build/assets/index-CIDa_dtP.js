import{j as t,B as e,aY as n}from"./index-CX99lCRz.js";import{u as s}from"./useQuery-CSwHKK-y.js";import{g as p}from"./export-DmShjBgl.js";import{E as m,a as d}from"./export-items-EVYrdHXy.js";import{P as x}from"./page-section-D11tcxDa.js";import{P as u}from"./printer-BkdCkTPy.js";import"./crud-B9laGzyy.js";import"./main-xqwdOJOB.js";import"./skeleton-BerTy1qd.js";import"./loader-circle-BqDSJ25w.js";import"./createLucideIcon-9FY8xTMI.js";const l=`
@media print {
  body * { visibility: hidden !important; }
  #export-print-area, #export-print-area * { visibility: visible !important; }
  #export-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }
  #export-print-area table { page-break-inside: auto; }
  #export-print-area tr { page-break-inside: avoid; page-break-after: auto; }
  @page { size: A4 portrait; margin: 8mm; }
}
`;function c({id:r}){const i=s({queryKey:["export-detail",r],queryFn:()=>p(r),enabled:Number.isFinite(r)&&r>0}),o=i.data?.data??i.data;return t.jsx(x,{isLoading:i.isLoading,error:i.error,data:o,title:"Phiếu xuất kho",showBack:!0,actions:t.jsxs(e,{variant:"outline",size:"sm",onClick:()=>window.print(),children:[t.jsx(u,{className:"h-4 w-4 mr-1.5"}),"In phiếu"]}),children:a=>t.jsxs("div",{className:"max-w-5xl mx-auto",children:[t.jsx("style",{children:l}),t.jsxs("div",{id:"export-print-area",className:"bg-white rounded-md shadow-sm border border-gray-200 p-5 print:shadow-none print:border-none print:p-0",children:[t.jsx(m,{data:a}),t.jsx(d,{data:a,items:a.items??[]})]})]})})}function N(){const{id:r}=n.useParams();return t.jsx(c,{id:Number(r)})}export{N as component};
