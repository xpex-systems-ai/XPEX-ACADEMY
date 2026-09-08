"""Generate the built-in XPeX AI course MP4 bundle during the container build.

The output is deterministic, browser-safe H.264/AAC, narrated in pt-BR with
espeak-ng, and contains no secrets or runtime student data. These assets are
served by FastAPI from /xpex-media and are rebuilt with every production image,
so they do not depend on ephemeral runtime uploads.
"""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

MODULES: list[tuple[str, str]] = [
    (
        "Fundamentos de Inteligência Artificial",
        "Nesta aula você vai entender o que é inteligência artificial, a diferença entre automação tradicional e modelos que aprendem padrões, e por que dados, contexto e objetivo importam. Pense em IA como uma ferramenta de apoio à decisão e à criação, não como uma fonte automática de verdade. Na prática, identifique uma tarefa repetitiva do seu dia e descreva entrada, resultado esperado e o que uma pessoa ainda precisa revisar. Use o material abaixo da aula para registrar essa primeira aplicação com segurança.",
    ),
    (
        "Como funcionam LLMs e IA generativa",
        "Modelos de linguagem trabalham prevendo sequências prováveis de tokens a partir do contexto recebido. Eles não consultam uma verdade universal e podem produzir respostas convincentes, porém incorretas. Nesta aula, observe como contexto, instrução e exemplos alteram a saída. Faça um teste com a mesma pergunta em três versões: curta, detalhada e acompanhada de um exemplo. Compare precisão, clareza e utilidade. Esse comportamento é a base para usar IA generativa de forma profissional.",
    ),
    (
        "Prompt Engineering",
        "Um bom prompt combina objetivo, contexto, restrições, formato de saída e critério de qualidade. Em vez de pedir apenas crie um texto, informe para quem, com qual finalidade, em qual tom e como a resposta será avaliada. Nesta aula, você vai usar uma estrutura simples: papel, tarefa, contexto, regras e exemplo. Depois, refine o resultado em ciclos curtos. A prática é transformar um pedido vago em uma instrução reutilizável que outra pessoa consiga aplicar e obter resultado consistente.",
    ),
    (
        "Ferramentas de IA para produtividade",
        "Produtividade com IA não significa automatizar tudo. Significa reduzir trabalho repetitivo e aumentar a qualidade das tarefas importantes. Use IA para resumir documentos, organizar ideias, gerar rascunhos, criar checklists e comparar alternativas. Sempre revise informações críticas antes de usar. Na prática, escolha uma tarefa semanal e divida em três partes: preparação, execução e revisão. Identifique onde a IA economiza tempo e onde o julgamento humano continua obrigatório. O material da aula traz um roteiro para documentar esse fluxo.",
    ),
    (
        "Automação com IA",
        "Automação conecta eventos, regras e ações. Com IA, um fluxo também pode interpretar texto, classificar informações e gerar conteúdo antes de executar a próxima etapa. Nesta aula, pense em um processo simples: uma mensagem chega, o sistema identifica a intenção, prepara uma resposta e encaminha para aprovação. A prática é desenhar esse fluxo em etapas e definir o que acontece quando a IA não tem confiança suficiente. Automação profissional precisa de validação, registros e uma saída segura para exceções.",
    ),
    (
        "APIs e integrações",
        "APIs permitem que sistemas conversem de forma estruturada. Uma requisição normalmente envia método, endereço, cabeçalhos e dados; a resposta retorna um status e um corpo. Nesta aula, você vai reconhecer os conceitos de endpoint, autenticação, JSON e códigos HTTP. Na prática, desenhe uma integração entre duas ferramentas que você já usa e liste quais dados entram, quais saem e quem pode acessar. Nunca coloque chaves secretas em páginas públicas ou no código do navegador. Integrações seguras mantêm credenciais no servidor.",
    ),
    (
        "RAG e conhecimento privado",
        "RAG combina busca em uma base de conhecimento com geração de resposta. Em vez de depender apenas da memória do modelo, o sistema recupera trechos relevantes e usa esse contexto para responder. Nesta aula, você vai entender documentos, fragmentação, embeddings, recuperação e citação de fontes. Na prática, escolha um pequeno conjunto de documentos e defina quais perguntas precisam ser respondidas com evidência. O objetivo é construir respostas rastreáveis e reduzir invenções quando a informação correta já existe na sua base.",
    ),
    (
        "Agentes de IA",
        "Um agente de IA recebe um objetivo, observa o estado atual, escolhe uma ação e pode usar ferramentas para avançar. Isso exige limites claros. Um agente não deve ganhar acesso irrestrito a contas, pagamentos ou dados sensíveis. Nesta aula, você vai separar planejamento, ferramenta, memória e verificação. Na prática, desenhe um agente para uma tarefa pequena e defina quais ações ele pode executar sozinho, quais precisam de confirmação humana e quais são proibidas. Bons agentes são úteis porque têm autonomia controlada.",
    ),
    (
        "Construção de projetos reais",
        "Projetos reais transformam conceitos em evidência. Comece com um problema claro, um usuário definido e um resultado observável. Construa a menor versão que prova valor, teste com dados reais controlados e registre o que funcionou e o que precisa melhorar. Nesta aula, sua prática é escolher um projeto de IA e escrever objetivo, entrada, saída, critério de sucesso e riscos. Depois, organize o trabalho em pequenas entregas. Portfólio profissional mostra processo, decisões e resultado, não apenas uma tela bonita.",
    ),
    (
        "IA aplicada a negócios e carreira",
        "IA cria valor quando melhora receita, reduz custo, acelera atendimento ou aumenta qualidade. Antes de adotar uma ferramenta, defina o problema e a métrica que será observada. Nesta aula, você vai conectar capacidade técnica com resultado de negócio e desenvolvimento profissional. Na prática, escolha uma atividade da sua área e descreva como ela funciona hoje, como poderia funcionar com IA e quais riscos precisam ser controlados. O diferencial profissional está em combinar ferramenta, conhecimento do contexto e responsabilidade.",
    ),
    (
        "Projeto final",
        "O projeto final reúne todo o percurso. Você deve entregar um artefato funcional, explicar o problema resolvido, demonstrar como a IA foi usada e apresentar evidências do resultado. Inclua também limites, riscos e próximos passos. Pode ser uma automação, um assistente com RAG, um agente controlado, um site com recursos de IA ou outra solução coerente com o curso. A avaliação considera clareza do objetivo, funcionamento, documentação e capacidade de explicar decisões. Construa algo que você consiga demonstrar e defender profissionalmente.",
    ),
]


def _run(command: list[str]) -> None:
    result = subprocess.run(command, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-2000:] or "media command failed")


def _escape_drawtext(value: str) -> str:
    return (
        value.replace("\\", r"\\")
        .replace(":", r"\:")
        .replace("'", r"\'")
        .replace("%", r"\%")
    )


def generate(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    font = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if not font.is_file():
        raise RuntimeError("DejaVuSans-Bold font is required for the XPeX video build")

    for index, (title, narration) in enumerate(MODULES, start=1):
        output = output_dir / f"module-{index:02d}.mp4"
        if output.is_file() and output.stat().st_size > 0:
            continue
        with tempfile.TemporaryDirectory(prefix=f"xpex-m{index:02d}-") as tmp:
            wav = Path(tmp) / "narration.wav"
            _run([
                "espeak-ng",
                "-v",
                "pt-br",
                "-s",
                "150",
                "-w",
                str(wav),
                narration,
            ])
            safe_title = _escape_drawtext(title)
            safe_font = _escape_drawtext(str(font))
            filter_graph = (
                "[0:v]"
                "drawbox=x=0:y=0:w=iw:h=12:color=0x00D4FF@0.95:t=fill,"
                "drawbox=x=0:y=ih-12:w=iw:h=12:color=0xFF7A00@0.95:t=fill,"
                f"drawtext=fontfile='{safe_font}':text='XPeX Academy':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=105,"
                f"drawtext=fontfile='{safe_font}':text='Módulo {index:02d}':fontcolor=0x00D4FF:fontsize=30:x=(w-text_w)/2:y=190,"
                f"drawtext=fontfile='{safe_font}':text='{safe_title}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=250,"
                f"drawtext=fontfile='{safe_font}':text='Inteligência Artificial — do Básico ao Avançado':fontcolor=0xCBD5E1:fontsize=25:x=(w-text_w)/2:y=325,"
                f"drawtext=fontfile='{safe_font}':text='Aula em vídeo + prática e material no percurso':fontcolor=0x94A3B8:fontsize=22:x=(w-text_w)/2:y=375"
                "[bg];"
                "[1:a]asplit=2[aout][awave];"
                "[awave]showwaves=s=1000x100:mode=line:colors=0x00D4FF:rate=24[wave];"
                "[bg][wave]overlay=(W-w)/2:H-185[v]"
            )
            _run([
                "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "color=c=0x07111d:s=1280x720:r=24",
                "-i",
                str(wav),
                "-filter_complex",
                filter_graph,
                "-map",
                "[v]",
                "-map",
                "[aout]",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "28",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-shortest",
                "-movflags",
                "+faststart",
                str(output),
            ])
        if not output.is_file() or output.stat().st_size == 0:
            raise RuntimeError(f"video build failed for module {index}")
        print(f"XPEX_STATIC_VIDEO_BUILT module={index} bytes={output.stat().st_size}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="/app/xpex-static-videos")
    args = parser.parse_args()
    generate(Path(args.output))
    print(f"PASS xpex_static_video_bundle_ready total={len(MODULES)}")


if __name__ == "__main__":
    main()
