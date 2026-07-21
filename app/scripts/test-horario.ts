import fs from "fs";
import { extractHorarioCodigo } from "../src/lib/scraper/portal-discente/parse-portal-horario";

function stripHtmlTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const rowHtml = `<tr>
									<td colspan="5" style="background: #C8D5EC; font-weight: bold; padding: 2px 0 2px 5px;">
										2026.1
									</td>
								</tr>
							
							<tr class="odd">
								<td class="descricao">
									
<form id="form_acessarTurmaVirtual" name="form_acessarTurmaVirtual" method="post" action="/sigaa/portais/discente/discente.jsf" enctype="application/x-www-form-urlencoded">
<input type="hidden" name="form_acessarTurmaVirtual" value="form_acessarTurmaVirtual">
<a href="#" onclick="var a=function(){return prevenirDuploClique();};var b=function(){if(typeof jsfcljs == 'function'){jsfcljs(document.getElementById('form_acessarTurmaVirtual'),{'form_acessarTurmaVirtual:j_id_jsp_161879646_442':'form_acessarTurmaVirtual:j_id_jsp_161879646_442','frontEndIdTurma':'7ED1D14E232CD954FD18FEB1870B08811E64C644'},'');}return false};return (a()==false) ? false : b();">TÓPICOS ESPECIAIS EM CIRCUITOS ELÉTRICOS E  ELETRÔNICOS: TELECOMUNICAÇÕES APLICADAS À MECATRÔNICA</a><input type="hidden" name="javax.faces.ViewState" id="javax.faces.ViewState" value="j_id2">
</form>
								</td>
								<td class="info" style="text-align:left">304, 321</td>
								<td class="info"><center>2M1234 (23/02/2026 - 04/07/2026)
									
									</center>
								</td>
								<td>
									
								</td>
								
							</tr>`;

const anchorMatch = rowHtml.match(/<a[^>]*onclick="[^"]*frontEndIdTurma[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
const nome = stripHtmlTags(anchorMatch?.[1] ?? "").trim();
const SKIP_DISCIPLINA_NOME = /^(mensagens|atualizar|perfil|sair|dossie|caixa\s+postal|componente\s+curricular)$/i;

if (!nome || nome.length < 2 || SKIP_DISCIPLINA_NOME.test(nome)) console.log("SKIPPED NOME");

const horarioRaw = stripHtmlTags(rowHtml);
console.log("horarioRaw:", horarioRaw);
const codigoHorario = extractHorarioCodigo(horarioRaw);
console.log("codigoHorario:", codigoHorario);
