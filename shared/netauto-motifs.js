// Compact, inline decorative accents; no external mask-image requests.
// Reference SVGs: device-motifs/circuit.svg and device-motifs/tools.svg.
(()=>{
  'use strict';
  const shapes=Object.freeze({
    CIRCUIT:"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"124\" y=\"24\" width=\"26\" height=\"24\" rx=\"3\"/><rect x=\"131\" y=\"31\" width=\"12\" height=\"10\" rx=\"1.5\"/><path d=\"M130 20v4m7-4v4m7-4v4m-14 24v4m7-4v4m7-4v4M120 30h4m-4 6h4m-4 6h4m26-12h4m-4 6h4m-4 6h4\"/><path d=\"M120 30H98L82 14H56M154 36h12l14 14M137 52v14l-14 14H92M137 20V12l12-12M180 92h-24l-10-10\"/><path d=\"M92 80H81l-5-8-5 16-5-8H43\"/><circle cx=\"53\" cy=\"14\" r=\"2.5\"/><circle cx=\"40\" cy=\"80\" r=\"2.5\"/><circle cx=\"144\" cy=\"80\" r=\"2\"/></g>",
    TOOLS:"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M52 96 99 49a21 21 0 0 0 25-27l-13 13-11-3-3-11 13-13a21 21 0 0 0-27 25L36 80a11 11 0 0 0 16 16Z\" fill=\"currentColor\" fill-opacity=\".1\"/><circle cx=\"45\" cy=\"87\" r=\"3\"/><g transform=\"translate(144 73)\"><path d=\"M-6-26H6l2 7 5 2 7-3 8 8-3 7 2 5 7 2v12l-7 2-2 5 3 7-8 8-7-3-5 2-2 7H-6l-2-7-5-2-7 3-8-8 3-7-2-5-7-2V2l7-2 2-5-3-7 8-8 7 3 5-2Z\"/><circle cy=\"8\" r=\"11\"/><circle cy=\"8\" r=\"4\"/></g><path d=\"M40 27h22M51 16v22M78 105h32\"/></g>",
  });
  function render(kind){
    const requested=String(kind).toUpperCase();
    const key=Object.hasOwn(shapes,requested)?requested:'CIRCUIT';
    return `<svg class="na-decor-motif" data-motif-kind="${key}" viewBox="0 0 180 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${shapes[key]}</svg>`;
  }
  window.NETAUTO_MOTIFS=Object.freeze({render});
})();
