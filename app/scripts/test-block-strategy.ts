const text = `2024.1 INTRODUÇÃO À PROGRAMAÇÃO DE COMPUTADORES
Dr. EDUARDO HABIB BECHELANE MAIA (60h) 01 APR G05IPCO0.
01 60 50 100,0 70.0 C
2025.2
INGLÊS INSTRUMENTAL I
Dra. MARIA ISABEL RIOS DE CARVALHO VIANA (2h), Dra. MARIA ISABEL RIOS DE
CARVALHO VIANA (28h)
01 APR G05IINT1.0
1
* 30 25 100,0 100.0 A`;

const lines = text.split("\n");

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const semMatch = line.match(/^(\d{4}\.\d)/);
  if (semMatch) {
    const start = i;
    let end = i + 1;
    // scan until next semester or end of array
    while (end < lines.length && !/^(\d{4}\.\d)/.test(lines[end])) {
      end++;
    }
    const block = lines.slice(start, end).join("\n");
    console.log("BLOCK FOUND:", block.replace(/\n/g, " | "));
    
    // Test code extraction
    const codigoMatch = block.match(/(?:^|\s)(G[T]?05[A-Z0-9.]+)/i);
    console.log("Código:", codigoMatch ? codigoMatch[1].replace(/\s/g, "") : "Not found");
    i = end;
  } else {
    i++;
  }
}
