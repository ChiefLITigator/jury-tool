// ═══════════════════════════════════════════════════════════
// pleading-shell.js
// Standalone + in-app California pleading shell generator
//
// Usage (Node CLI):  node pleading-shell.js
// Usage (browser):   window.generatePleadingShell(options)
// Returns:           Promise<Buffer> in Node, Promise<Blob> in browser
// ═══════════════════════════════════════════════════════════

'use strict';

// ─ ENVIRONMENT DETECTION ─────────────────────────────────────────────────────
const IS_NODE = typeof window === 'undefined';

// ─ PLEADING HEADER XML ───────────────────────────────────────────────────────
// Extracted verbatim from word/header2.xml of:
//   "Reply ISO Plaintiff MIL 1 2-13-26.docx"
// Contains line numbers 1–28 and double vertical bar as absolute drawing
// objects (VML + DrawingML). Injected via ZIP patching after doc generation.
// DO NOT modify or attempt to regenerate this XML programmatically.
const PLEADING_HEADER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14"><w:p w14:paraId="52CE7309" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRDefault="007E7F0B"><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251656704" behindDoc="0" locked="0" layoutInCell="0" allowOverlap="1" wp14:anchorId="4860239C" wp14:editId="2B42EB71"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>-91440</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="635" cy="10058400"/><wp:effectExtent l="0" t="0" r="12065" b="0"/><wp:wrapNone/><wp:docPr id="600724588" name="Line 7"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvCnPr/><wps:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="635" cy="10058400"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="9525"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:round/><a:headEnd w="sm" len="sm"/><a:tailEnd w="sm" len="sm"/></a:ln><a:effectLst/><a:extLst><a:ext uri="{909E8E84-426E-40DD-AFC4-6F175D3DCCD1}"><a14:hiddenFill xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><a:noFill/></a14:hiddenFill></a:ext><a:ext uri="{AF507438-7753-43E0-B8FC-AC1667EBCBE1}"><a14:hiddenEffects xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><a:effectLst><a:outerShdw dist="35921" dir="2700000" algn="ctr" rotWithShape="0"><a:srgbClr val="808080"/></a:outerShdw></a:effectLst></a14:hiddenEffects></a:ext></a:extLst></wps:spPr><wps:bodyPr/></wps:wsp></a:graphicData></a:graphic><wp14:sizeRelH relativeFrom="page"><wp14:pctWidth>0</wp14:pctWidth></wp14:sizeRelH><wp14:sizeRelV relativeFrom="page"><wp14:pctHeight>0</wp14:pctHeight></wp14:sizeRelV></wp:anchor></w:drawing></mc:Choice><mc:Fallback><w:pict><v:line w14:anchorId="66621DA0" id="Line 7" o:spid="_x0000_s1026" style="position:absolute;z-index:251649536;visibility:visible;mso-wrap-style:square;mso-width-percent:0;mso-height-percent:0;mso-wrap-distance-left:9pt;mso-wrap-distance-top:0;mso-wrap-distance-right:9pt;mso-wrap-distance-bottom:0;mso-position-horizontal:absolute;mso-position-horizontal-relative:margin;mso-position-vertical:absolute;mso-position-vertical-relative:page;mso-width-percent:0;mso-height-percent:0;mso-width-relative:page;mso-height-relative:page" from="-7.2pt,0" to="-7.15pt,11in" o:gfxdata="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" o:allowincell="f"><v:stroke startarrowwidth="narrow" startarrowlength="short" endarrowwidth="narrow" endarrowlength="short"/><w10:wrap anchorx="margin" anchory="page"/></v:line></w:pict></mc:Fallback></mc:AlternateContent></w:r><w:r><w:rPr><w:noProof/></w:rPr><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251655680" behindDoc="0" locked="1" layoutInCell="0" allowOverlap="1" wp14:anchorId="414F2ABD" wp14:editId="15276297"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>-45720</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="635" cy="10058400"/><wp:effectExtent l="0" t="0" r="12065" b="0"/><wp:wrapNone/><wp:docPr id="1379881535" name="Line 6"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvCnPr/><wps:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="635" cy="10058400"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="9525"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:round/><a:headEnd w="sm" len="sm"/><a:tailEnd w="sm" len="sm"/></a:ln><a:effectLst/><a:extLst><a:ext uri="{909E8E84-426E-40DD-AFC4-6F175D3DCCD1}"><a14:hiddenFill xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><a:noFill/></a14:hiddenFill></a:ext><a:ext uri="{AF507438-7753-43E0-B8FC-AC1667EBCBE1}"><a14:hiddenEffects xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><a:effectLst><a:outerShdw dist="35921" dir="2700000" algn="ctr" rotWithShape="0"><a:srgbClr val="808080"/></a:outerShdw></a:effectLst></a14:hiddenEffects></a:ext></a:extLst></wps:spPr><wps:bodyPr/></wps:wsp></a:graphicData></a:graphic><wp14:sizeRelH relativeFrom="page"><wp14:pctWidth>0</wp14:pctWidth></wp14:sizeRelH><wp14:sizeRelV relativeFrom="page"><wp14:pctHeight>0</wp14:pctHeight></wp14:sizeRelV></wp:anchor></w:drawing></mc:Choice><mc:Fallback><w:pict><v:line w14:anchorId="2646C215" id="Line 6" o:spid="_x0000_s1026" style="position:absolute;z-index:251648512;visibility:visible;mso-wrap-style:square;mso-width-percent:0;mso-height-percent:0;mso-wrap-distance-left:9pt;mso-wrap-distance-top:0;mso-wrap-distance-right:9pt;mso-wrap-distance-bottom:0;mso-position-horizontal:absolute;mso-position-horizontal-relative:margin;mso-position-vertical:absolute;mso-position-vertical-relative:page;mso-width-percent:0;mso-height-percent:0;mso-width-relative:page;mso-height-relative:page" from="-3.6pt,0" to="-3.55pt,11in" o:gfxdata="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" o:allowincell="f"><v:stroke startarrowwidth="narrow" startarrowlength="short" endarrowwidth="narrow" endarrowlength="short"/><w10:wrap anchorx="margin" anchory="page"/><w10:anchorlock/></v:line></w:pict></mc:Fallback></mc:AlternateContent></w:r><w:r><w:rPr><w:noProof/></w:rPr><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251653632" behindDoc="0" locked="1" layoutInCell="0" allowOverlap="1" wp14:anchorId="22FDEABD" wp14:editId="02230AC3"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>-548640</wp:posOffset></wp:positionH><wp:positionV relativeFrom="margin"><wp:posOffset>-45720</wp:posOffset></wp:positionV><wp:extent cx="457200" cy="8867140"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="1922069549" name="Rectangle 5"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr/><wps:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="457200" cy="8867140"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/><a:extLst><a:ext uri="{909E8E84-426E-40DD-AFC4-6F175D3DCCD1}"><a14:hiddenFill xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a14:hiddenFill></a:ext><a:ext uri="{91240B29-F687-4F45-9708-019B960494DF}"><a14:hiddenLine xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" w="9525"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:miter lim="800000"/><a:headEnd/><a:tailEnd/></a14:hiddenLine></a:ext><a:ext uri="{AF507438-7753-43E0-B8FC-AC1667EBCBE1}"><a14:hiddenEffects xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><a:effectLst/></a14:hiddenEffects></a:ext></a:extLst></wps:spPr><wps:txbx><w:txbxContent><w:p w14:paraId="6DCA6502" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>1</w:t></w:r></w:p><w:p w14:paraId="0891EA00" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>2</w:t></w:r></w:p><w:p w14:paraId="60CAC79B" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>3</w:t></w:r></w:p><w:p w14:paraId="5E587BB2" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>4</w:t></w:r></w:p><w:p w14:paraId="038E3535" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>5</w:t></w:r></w:p><w:p w14:paraId="019BE80E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>6</w:t></w:r></w:p><w:p w14:paraId="55222498" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>7</w:t></w:r></w:p><w:p w14:paraId="19E2CE50" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>8</w:t></w:r></w:p><w:p w14:paraId="2D119201" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>9</w:t></w:r></w:p><w:p w14:paraId="161AFA05" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>10</w:t></w:r></w:p><w:p w14:paraId="23F65A80" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>11</w:t></w:r></w:p><w:p w14:paraId="3CFA9B52" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>12</w:t></w:r></w:p><w:p w14:paraId="752562D1" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>13</w:t></w:r></w:p><w:p w14:paraId="364CD773" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>14</w:t></w:r></w:p><w:p w14:paraId="3CF2236E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>15</w:t></w:r></w:p><w:p w14:paraId="304605D5" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>16</w:t></w:r></w:p><w:p w14:paraId="095A922D" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>17</w:t></w:r></w:p><w:p w14:paraId="72A67AFF" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>18</w:t></w:r></w:p><w:p w14:paraId="77C980BE" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>19</w:t></w:r></w:p><w:p w14:paraId="085CFFD3" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>20</w:t></w:r></w:p><w:p w14:paraId="72CEEC6F" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>21</w:t></w:r></w:p><w:p w14:paraId="075153AA" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>22</w:t></w:r></w:p><w:p w14:paraId="5603659E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>23</w:t></w:r></w:p><w:p w14:paraId="5B5E3577" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>24</w:t></w:r></w:p><w:p w14:paraId="4835F29E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>25</w:t></w:r></w:p><w:p w14:paraId="58A96FD0" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>26</w:t></w:r></w:p><w:p w14:paraId="77336549" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>27</w:t></w:r></w:p><w:p w14:paraId="09C1A2D9" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>28</w:t></w:r></w:p><w:p w14:paraId="64912616" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:sz w:val="28"/></w:rPr></w:pPr></w:p></w:txbxContent></wps:txbx><wps:bodyPr rot="0" vert="horz" wrap="square" lIns="12700" tIns="12700" rIns="12700" bIns="12700" anchor="t" anchorCtr="0" upright="1"/></wps:wsp></a:graphicData></a:graphic><wp14:sizeRelH relativeFrom="page"><wp14:pctWidth>0</wp14:pctWidth></wp14:sizeRelH><wp14:sizeRelV relativeFrom="page"><wp14:pctHeight>0</wp14:pctHeight></wp14:sizeRelV></wp:anchor></w:drawing></mc:Choice><mc:Fallback><w:pict><v:rect w14:anchorId="22FDEABD" id="Rectangle 5" o:spid="_x0000_s1027" style="position:absolute;margin-left:-43.2pt;margin-top:-3.6pt;width:36pt;height:698.2pt;z-index:251653632;visibility:visible;mso-wrap-style:square;mso-width-percent:0;mso-height-percent:0;mso-wrap-distance-left:9pt;mso-wrap-distance-top:0;mso-wrap-distance-right:9pt;mso-wrap-distance-bottom:0;mso-position-horizontal:absolute;mso-position-horizontal-relative:margin;mso-position-vertical:absolute;mso-position-vertical-relative:margin;mso-width-percent:0;mso-height-percent:0;mso-width-relative:page;mso-height-relative:page;v-text-anchor:top" o:gfxdata="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" o:allowincell="f" filled="f" stroked="f"><v:textbox inset="1pt,1pt,1pt,1pt"><w:txbxContent><w:p w14:paraId="6DCA6502" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>1</w:t></w:r></w:p><w:p w14:paraId="0891EA00" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>2</w:t></w:r></w:p><w:p w14:paraId="60CAC79B" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>3</w:t></w:r></w:p><w:p w14:paraId="5E587BB2" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>4</w:t></w:r></w:p><w:p w14:paraId="038E3535" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>5</w:t></w:r></w:p><w:p w14:paraId="019BE80E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>6</w:t></w:r></w:p><w:p w14:paraId="55222498" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>7</w:t></w:r></w:p><w:p w14:paraId="19E2CE50" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>8</w:t></w:r></w:p><w:p w14:paraId="2D119201" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>9</w:t></w:r></w:p><w:p w14:paraId="161AFA05" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>10</w:t></w:r></w:p><w:p w14:paraId="23F65A80" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>11</w:t></w:r></w:p><w:p w14:paraId="3CFA9B52" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>12</w:t></w:r></w:p><w:p w14:paraId="752562D1" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>13</w:t></w:r></w:p><w:p w14:paraId="364CD773" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>14</w:t></w:r></w:p><w:p w14:paraId="3CF2236E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>15</w:t></w:r></w:p><w:p w14:paraId="304605D5" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>16</w:t></w:r></w:p><w:p w14:paraId="095A922D" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>17</w:t></w:r></w:p><w:p w14:paraId="72A67AFF" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>18</w:t></w:r></w:p><w:p w14:paraId="77C980BE" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>19</w:t></w:r></w:p><w:p w14:paraId="085CFFD3" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>20</w:t></w:r></w:p><w:p w14:paraId="72CEEC6F" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>21</w:t></w:r></w:p><w:p w14:paraId="075153AA" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>22</w:t></w:r></w:p><w:p w14:paraId="5603659E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>23</w:t></w:r></w:p><w:p w14:paraId="5B5E3577" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>24</w:t></w:r></w:p><w:p w14:paraId="4835F29E" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>25</w:t></w:r></w:p><w:p w14:paraId="58A96FD0" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>26</w:t></w:r></w:p><w:p w14:paraId="77336549" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>27</w:t></w:r></w:p><w:p w14:paraId="09C1A2D9" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRPr="00D16635" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr></w:pPr><w:r w:rsidRPr="00D16635"><w:rPr><w:rFonts w:cs="Courier New"/><w:bCs/></w:rPr><w:t>28</w:t></w:r></w:p><w:p w14:paraId="64912616" w14:textId="77777777" w:rsidR="007E7F0B" w:rsidRDefault="007E7F0B"><w:pPr><w:rPr><w:sz w:val="28"/></w:rPr></w:pPr></w:p></w:txbxContent></v:textbox><w10:wrap anchorx="margin" anchory="margin"/><w10:anchorlock/></v:rect></w:pict></mc:Fallback></mc:AlternateContent></w:r></w:p></w:hdr>`;

// ─ CRC32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (function () {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─ ZIP UTILITIES ─────────────────────────────────────────────────────────────
// Pure-Node ZIP reader. Returns array of { name: string, data: Buffer }.
function readZipEntries(zipBuf) {
  const entries = [];
  let pos = 0;
  while (pos < zipBuf.length - 4) {
    if (zipBuf.readUInt32LE(pos) === 0x04034b50) {
      const compression  = zipBuf.readUInt16LE(pos + 8);
      const compSize     = zipBuf.readUInt32LE(pos + 18);
      const fnLen        = zipBuf.readUInt16LE(pos + 26);
      const extraLen     = zipBuf.readUInt16LE(pos + 28);
      const name         = zipBuf.slice(pos + 30, pos + 30 + fnLen).toString('utf8');
      const dataStart    = pos + 30 + fnLen + extraLen;
      const compData     = zipBuf.slice(dataStart, dataStart + compSize);
      const zlib         = require('zlib');
      const data = compression === 8 ? zlib.inflateRawSync(compData) : compData;
      entries.push({ name, data: Buffer.from(data) });
      pos = dataStart + compSize;
    } else {
      pos++;
    }
  }
  return entries;
}

// Write a ZIP buffer from { name, data } entries.
// In Node uses deflate; in browser stores uncompressed (no zlib available).
function writeZip(entries) {
  const useDeflate = IS_NODE;
  const zlib = IS_NODE ? require('zlib') : null;

  const localParts = [];
  const cdEntries  = [];
  let   offset     = 0;

  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    const dataBuf   = Buffer.isBuffer(data) ? data : Buffer.from(data);
    let payload, compression;
    if (useDeflate) {
      const compressed = zlib.deflateRawSync(dataBuf, { level: 6 });
      if (compressed.length < dataBuf.length) {
        payload = compressed; compression = 8;
      } else {
        payload = dataBuf; compression = 0;
      }
    } else {
      payload = dataBuf; compression = 0;
    }
    const crc = crc32(dataBuf);

    // Local file header (30 bytes + filename)
    const lh = Buffer.alloc(30 + nameBytes.length);
    lh.writeUInt32LE(0x04034b50, 0);          // signature
    lh.writeUInt16LE(20, 4);                   // version needed
    lh.writeUInt16LE(0, 6);                    // flags
    lh.writeUInt16LE(compression, 8);
    lh.writeUInt16LE(0, 10);                   // mod time
    lh.writeUInt16LE(0, 12);                   // mod date
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(payload.length, 18);      // compressed size
    lh.writeUInt32LE(dataBuf.length, 22);      // uncompressed size
    lh.writeUInt16LE(nameBytes.length, 26);
    lh.writeUInt16LE(0, 28);                   // extra length
    nameBytes.copy(lh, 30);

    localParts.push(lh, payload);
    cdEntries.push({ nameBytes, compression, crc,
                     compSize: payload.length, uncompSize: dataBuf.length, offset });
    offset += lh.length + payload.length;
  }

  // Central directory
  const cdParts = cdEntries.map(c => {
    const cd = Buffer.alloc(46 + c.nameBytes.length);
    cd.writeUInt32LE(0x02014b50, 0);           // signature
    cd.writeUInt16LE(20, 4);                   // version made by
    cd.writeUInt16LE(20, 6);                   // version needed
    cd.writeUInt16LE(0, 8);                    // flags
    cd.writeUInt16LE(c.compression, 10);
    cd.writeUInt16LE(0, 12);                   // mod time
    cd.writeUInt16LE(0, 14);                   // mod date
    cd.writeUInt32LE(c.crc, 16);
    cd.writeUInt32LE(c.compSize, 20);
    cd.writeUInt32LE(c.uncompSize, 24);
    cd.writeUInt16LE(c.nameBytes.length, 28);
    cd.writeUInt16LE(0, 30);                   // extra length
    cd.writeUInt16LE(0, 32);                   // comment length
    cd.writeUInt16LE(0, 34);                   // disk start
    cd.writeUInt16LE(0, 36);                   // internal attr
    cd.writeUInt32LE(0, 38);                   // external attr
    cd.writeUInt32LE(c.offset, 42);
    c.nameBytes.copy(cd, 46);
    return cd;
  });
  const cdBuf = Buffer.concat(cdParts);

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(cdEntries.length, 8);
  eocd.writeUInt16LE(cdEntries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuf, eocd]);
}

// ─ DOCX HELPERS ──────────────────────────────────────────────────────────────
function getDocx() {
  return IS_NODE ? require('docx') : window.docx;
}

// Standard body paragraph: double-spaced, Times New Roman 12pt
function bp(children, opts = {}) {
  const { Paragraph } = getDocx();
  return new Paragraph({
    children,
    spacing: { line: 480 },
    ...opts,
  });
}

// Standard text run: Times New Roman 12pt
function tr(text, opts = {}) {
  const { TextRun } = getDocx();
  return new TextRun({ text, font: 'Times New Roman', size: 24, ...opts });
}

// Placeholder run (gray bracketed text)
function ph(placeholder, opts = {}) {
  return tr(placeholder, { color: '808080', ...opts });
}

// ─ FOOTER BUILDERS ───────────────────────────────────────────────────────────
function makeDefaultFooter(fields) {
  const { Footer, Paragraph, TextRun, PageNumber, AlignmentType, BorderStyle, TabStopType } = getDocx();
  const title = fields.footer_title || fields.document_title || '[DOCUMENT TITLE]';
  return new Footer({
    children: [
      // Line 1: horizontal rule + centered page number
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'auto', space: 1 } },
        spacing: { line: 240 },
        tabStops: [
          { type: TabStopType.CENTER, position: 4680 },
          { type: TabStopType.RIGHT,  position: 9360 },
        ],
        children: [
          new TextRun({ text: '\t', size: 20 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 20, font: 'Courier New' }),
        ],
      }),
      // Line 2: centered document title, bold 9pt
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 240 },
        children: [
          new TextRun({ text: title, font: 'Times New Roman', size: 18, bold: true }),
        ],
      }),
    ],
  });
}

// First-page footer: rule + title, no page number
function makeFirstPageFooter(fields) {
  const { Footer, Paragraph, TextRun, AlignmentType, BorderStyle } = getDocx();
  const title = fields.footer_title || fields.document_title || '[DOCUMENT TITLE]';
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'auto', space: 1 } },
        spacing: { line: 240 },
        children: [],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 240 },
        children: [
          new TextRun({ text: title, font: 'Times New Roman', size: 18, bold: true }),
        ],
      }),
    ],
  });
}

// ─ CAPTION TABLE ─────────────────────────────────────────────────────────────
function makeCaption(fields) {
  const {
    Table, TableRow, TableCell, Paragraph, TextRun,
    AlignmentType, BorderStyle, WidthType,
  } = getDocx();

  const f = fields;
  const FONT = 'Times New Roman';
  const SZ   = 24;

  function cell(children, borders) {
    return new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders, children });
  }

  function cPara(runs, alignment) {
    return new Paragraph({
      spacing: { line: 240 },
      alignment: alignment || AlignmentType.LEFT,
      children: runs,
    });
  }

  function cRun(text, bold) {
    return new TextRun({ text, font: FONT, size: SZ, bold: !!bold });
  }

  // Left cell border spec (all four sides)
  const leftBorders = {
    top:    { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    left:   { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right:  { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  };
  // Right cell: top+left only (no bottom, no right)
  const rightBorders = {
    top:    { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.NONE },
    left:   { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right:  { style: BorderStyle.NONE },
  };

  const plaintiffName = f.plaintiff_name || '[PLAINTIFF NAME]';
  const plaintiffType = f.plaintiff_type || '[an Individual,]';
  const defendantName = f.defendant_name || '[DEFENDANT NAME]';
  const defendantType = f.defendant_type || '[a Delaware LLC,]';
  const addlParties   = f.additional_parties || '';

  const leftChildren = [
    cPara([cRun(plaintiffName)]),
    cPara([cRun(plaintiffType)]),
    cPara([cRun('')]),
    cPara([cRun('Plaintiff,')], AlignmentType.RIGHT),
    cPara([cRun('')]),
    cPara([cRun('v.')]),
    cPara([cRun('')]),
    cPara([cRun(defendantName)]),
    cPara([cRun(defendantType)]),
    ...(addlParties ? [cPara([cRun(addlParties)])] : []),
    cPara([cRun('')]),
    cPara([cRun('Defendants.')], AlignmentType.RIGHT),
  ];

  const caseNum   = f.case_number    || '[Case No.: XXXXXXXXXX]';
  const judgeName = f.judge_name     || '[Hon. Judge Name]';
  const deptNum   = f.dept_number    || '[Dept. XX]';
  const docTitle  = f.document_title || '[DOCUMENT TITLE]';
  const hrDate    = f.hearing_date   || '';
  const hrTime    = f.hearing_time   || '';
  const hrDept    = f.hearing_dept   || '';
  const compFiled = f.complaint_filed|| '';
  const trialDate = f.trial_date     || '';

  const rightChildren = [
    cPara([cRun(caseNum)]),
    cPara([cRun('')]),
    cPara([cRun(judgeName)]),
    cPara([cRun(deptNum)]),
    cPara([cRun('')]),
    cPara([cRun(docTitle, true)]),
    cPara([cRun('')]),
    ...(hrDate ? [cPara([cRun('Date: ' + hrDate)])] : []),
    ...(hrTime ? [cPara([cRun('Time: ' + hrTime)])] : []),
    ...(hrDept ? [cPara([cRun('Dept.: ' + hrDept)])] : []),
    ...(hrDate || hrTime || hrDept ? [cPara([cRun('')])] : []),
    ...(compFiled ? [cPara([cRun('Complaint Filed: ' + compFiled)])] : []),
    ...(trialDate ? [cPara([cRun('Trial Date: ' + trialDate)])]     : []),
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          cell(leftChildren,  leftBorders),
          cell(rightChildren, rightBorders),
        ],
      }),
    ],
  });
}

// ─ BODY BUILDER ──────────────────────────────────────────────────────────────
function buildBody(fields) {
  const { Paragraph, TextRun, AlignmentType } = getDocx();
  const f = fields;

  // Attorney block (lines 1–7 area, left of center)
  const attyName  = f.attorney_name     || '[Attorney Name]';
  const sbn       = f.state_bar_number  || 'SBN XXXXXX';
  const firmName  = f.firm_name         || '[Firm Name]';
  const addr1     = f.firm_address_1    || '[Street Address]';
  const addr2     = f.firm_address_2    || '[City, State ZIP]';
  const phone     = f.firm_phone        || '[Telephone: (XXX) XXX-XXXX]';
  const fax       = f.firm_fax          || '[Fax: (XXX) XXX-XXXX]';
  const email     = f.firm_email        || '[Email: attorney@firm.com]';
  const attyFor   = f.attorney_for      || '[Attorney for Plaintiff/Defendant NAME]';

  const attyBlock = [
    bp([tr(attyName + ', ' + sbn)]),
    bp([tr(firmName)]),
    bp([tr(addr1)]),
    bp([tr(addr2)]),
    bp([tr(phone)]),
    bp([tr(fax)]),
    bp([tr(email)]),
    bp([tr('')]),
    bp([tr(attyFor)]),
  ];

  // Court name (Zone 3 — centered)
  const courtName   = f.court_name   || 'SUPERIOR COURT OF THE STATE OF CALIFORNIA';
  const courtCounty = f.court_county || 'FOR THE COUNTY OF LOS ANGELES - CENTRAL DISTRICT';

  const courtBlock = [
    bp([tr(courtName)],   { alignment: AlignmentType.CENTER }),
    bp([tr(courtCounty)], { alignment: AlignmentType.CENTER }),
  ];

  // Caption table
  const captionTable = makeCaption(fields);

  // Post-caption body area
  const docTitle = fields.document_title || '[DOCUMENT TITLE]';
  const bodyArea = [
    bp([tr('')]),
    bp([tr(docTitle, { bold: true })], { alignment: AlignmentType.CENTER }),
    bp([tr('')]),
    bp([tr('')]),
    bp([tr('')]),
  ];

  return [...attyBlock, ...courtBlock, captionTable, ...bodyArea];
}

// ─ HEADER INJECTION ──────────────────────────────────────────────────────────
// After generating the DOCX, replaces word/header1.xml with PLEADING_HEADER_XML.
// The reference header has no external relationships — no .rels changes needed.
function injectPleadingHeader(zipBuf) {
  const entries  = readZipEntries(zipBuf);
  const xmlBuf   = Buffer.from(PLEADING_HEADER_XML, 'utf8');
  let   injected = 0;
  for (const entry of entries) {
    if (/^word\/header\d+\.xml$/.test(entry.name)) {
      entry.data = xmlBuf;
      injected++;
    }
  }
  if (!injected) {
    console.warn('Warning: no header entry found in generated DOCX; header not injected.');
  }
  return writeZip(entries);
}

// ─ CORE GENERATION FUNCTION ──────────────────────────────────────────────────
// options.fields: object with field values (all optional; defaults to placeholders)
// Returns Promise<Buffer> in Node, Promise<Blob> in browser.
async function generatePleadingShell(options = {}) {
  const { fields = {} } = options;

  const {
    Document, Header, Paragraph, TextRun, Packer,
  } = getDocx();

  // Placeholder header — will be replaced via ZIP patching
  const placeholderHeader = new Header({
    children: [new Paragraph({ children: [new TextRun('')] })],
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 15840 },    // 8.5" × 11"
          margin: { top: 1080, bottom: 630, left: 1440, right: 720, header: 720 },
        },
        titlePage: true,  // enables separate first-page footer
      },
      headers: {
        default: placeholderHeader,
        first:   placeholderHeader,
      },
      footers: {
        default: makeDefaultFooter(fields),
        first:   makeFirstPageFooter(fields),
      },
      children: buildBody(fields),
    }],
  });

  let docBuf;
  if (IS_NODE) {
    docBuf = await Packer.toBuffer(doc);
  } else {
    docBuf = Buffer.from(await Packer.toBuffer(doc));
  }

  // Inject the reference pleading header via ZIP patching
  const patched = injectPleadingHeader(docBuf);

  if (IS_NODE) {
    return patched;
  } else {
    return new Blob([patched], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }
}

// ─ STANDALONE CLI ────────────────────────────────────────────────────────────
async function runCLI() {
  const readline = require('readline');
  const fs       = require('fs');
  const path     = require('path');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt, defaultVal) => new Promise(resolve => {
    const display = defaultVal ? `${prompt} [${defaultVal}]: ` : `${prompt}: `;
    rl.question(display, ans => resolve(ans.trim() || defaultVal || ''));
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('  California Pleading Shell Generator');
  console.log('═══════════════════════════════════════════\n');

  const fields = {};

  // Attorney block
  fields.attorney_name    = await ask('1.  Attorney name',          '');
  fields.state_bar_number = await ask('    State Bar No. (SBN)',     '');
  fields.firm_name        = await ask('2.  Firm name',              '');
  fields.firm_address_1   = await ask('3.  Street address',         '');
  fields.firm_address_2   = await ask('4.  City, State ZIP',        '');
  fields.firm_phone       = await ask('5.  Phone',                  '');
  fields.firm_fax         = await ask('6.  Fax (Enter to skip)',     '');
  fields.firm_email       = await ask('7.  Email',                  '');
  fields.attorney_for     = await ask('8.  Attorney for',           '');

  // Court
  fields.court_name   = await ask('9.  Court name',
    'SUPERIOR COURT OF THE STATE OF CALIFORNIA');
  fields.court_county = await ask('10. County/district',
    'FOR THE COUNTY OF LOS ANGELES - CENTRAL DISTRICT');

  // Parties
  fields.plaintiff_name       = await ask('11. Plaintiff name',           '');
  fields.plaintiff_type       = await ask('12. Plaintiff description',    'an Individual,');
  fields.defendant_name       = await ask('13. Defendant name',           '');
  fields.defendant_type       = await ask('14. Defendant description',    'a Delaware LLC,');
  fields.additional_parties   = await ask('15. Additional parties (Enter to skip)', '');

  // Case info
  fields.case_number   = await ask('16. Case number',  '');
  fields.judge_name    = await ask('17. Judge name',   '');
  fields.dept_number   = await ask('    Department',   '');
  fields.document_title= await ask('18. Document title', '');

  // Hearing & dates
  fields.hearing_date   = await ask('19. Hearing date (Enter to skip)',       '');
  fields.hearing_time   = await ask('20. Hearing time (Enter to skip)',       '');
  fields.hearing_dept   = await ask('21. Hearing dept (Enter to skip)',       '');
  fields.complaint_filed= await ask('22. Complaint filed (Enter to skip)',    '');
  fields.trial_date     = await ask('23. Trial date (Enter to skip)',         '');

  fields.footer_title = fields.document_title;

  rl.close();

  // Summary
  console.log('\n─── Summary ───────────────────────────────');
  console.log(`Attorney:   ${fields.attorney_name}, SBN ${fields.state_bar_number}`);
  console.log(`Firm:       ${fields.firm_name}`);
  console.log(`Case No.:   ${fields.case_number}`);
  console.log(`Title:      ${fields.document_title}`);
  console.log('───────────────────────────────────────────\n');

  console.log('Generating pleading shell…');

  const buf = await generatePleadingShell({ fields });

  const caseSlug = (fields.case_number || 'Unknown').replace(/[^A-Za-z0-9]/g, '_');
  const dateStr  = new Date().toISOString().slice(0, 10);
  const outFile  = path.join(process.cwd(), `Pleading_Shell_${caseSlug}_${dateStr}.docx`);

  fs.writeFileSync(outFile, buf);
  console.log(`Done. File written: ${outFile}`);
  console.log(`Size: ${(buf.length / 1024).toFixed(1)} KB\n`);
}

// ─ ENTRYPOINTS ───────────────────────────────────────────────────────────────
if (IS_NODE && require.main === module) {
  runCLI().catch(e => { console.error('\nError:', e.message); process.exit(1); });
}

if (!IS_NODE) {
  window.generatePleadingShell = generatePleadingShell;
}

// Export for use as a Node module
if (IS_NODE) {
  module.exports = { generatePleadingShell };
}
