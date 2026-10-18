"""Popula a coleção region_profiles do Firestore com os dados das RAs.

Os valores são FICTÍCIOS (a Asa Norte segue o design do Figma). Quando os dados
oficiais (PDAD, SSP-DF, STPC/DF) estiverem prontos, basta trocar os dicionários
abaixo mantendo o mesmo formato e rodar o script de novo: cada documento é
sobrescrito por inteiro, então rodar mais de uma vez não duplica nada.

Uso (o projeto padrão é o do .env.local do app):
    python3 -m pip install -r scripts/requirements.txt
    gcloud auth application-default login     # ou use --credenciais chave.json
    python3 scripts/seed_regioes.py
    python3 scripts/seed_regioes.py --dry-run  # só imprime o JSON, sem Firebase
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys

COLECAO = "region_profiles"

# Escala do gráfico de segurança: os rótulos ficam igualmente espaçados e o
# valor é interpolado dentro da faixa em que cai.
TICKS_SEGURANCA = [0, 10, 25, 50, 100, 150]

# Crime e a faixa usada para sortear valores fictícios plausíveis.
CRIMES = [
    ("Homicídio", 1, 15),
    ("Roubo de veículo", 5, 60),
    ("Furto de veículos", 20, 145),
    ("Roubo em coletivo", 2, 30),
    ("Roubo em comércio", 5, 60),
    ("Roubo de pedestre", 20, 145),
    ("Furto em pedestres", 20, 145),
]

ITENS_LAZER = [
    "Ruas arborizadas",
    "Travessia sinalizada",
    "Ponto de ônibus",
    "Praça",
    "Ciclovia/Ciclofaixa",
    "Quadras esportivas",
    "Academia/PEC",
    "Jardins/Parques",
    "Espaço cultural",
]

ITENS_INFRAESTRUTURA = [
    "Rua asfaltada",
    "Rua iluminada",
    "Rua com calçada",
    "Ruas arborizadas",
    "Drenagem de chuva",
    "Coleta seletiva",
]

# Renda domiciliar média mensal (R$) usada no gráfico comparativo.
RANKING_RENDA = [
    ("lago-sul", "Lago Sul", 21500.00),
    ("park-way", "Park Way", 14800.00),
    ("asa-norte", "Asa Norte", 11012.60),
    ("asa-sul", "Asa Sul", 10850.00),
    ("sudoeste-octogonal", "Sudoeste/Octogonal", 10400.00),
    ("lago-norte", "Lago Norte", 9900.00),
    ("jardim-botanico", "Jardim Botânico", 9200.00),
    ("aguas-claras", "Águas Claras", 8100.00),
    ("guara", "Guará", 6900.00),
    ("cruzeiro", "Cruzeiro", 6500.00),
    ("nucleo-bandeirante", "Núcleo Bandeirante", 5600.00),
    ("taguatinga", "Taguatinga", 5200.00),
    ("vicente-pires", "Vicente Pires", 5000.00),
    ("sobradinho", "Sobradinho", 4600.00),
    ("gama", "Gama", 3400.00),
    ("ceilandia", "Ceilândia", 2900.00),
    ("samambaia", "Samambaia", 2700.00),
    ("recanto-das-emas", "Recanto das Emas", 2300.00),
]

REGIOES = [
    {
        "id": "asa-norte",
        "name": "Asa Norte",
        "lat": -15.7633,
        "lng": -47.8829,
        "tags": ["Próximo à UnB", "Lazer", "Mobilidade"],
        "description": (
            "Uma das regiões administrativas mais consolidadas e movimentadas do "
            "Distrito Federal. Localizada no coração do Plano Piloto, a Asa Norte é "
            "um polo universitário, comercial e residencial, oferecendo ampla "
            "infraestrutura de serviços, transporte e lazer."
        ),
        "mobility": {
            "summary": "Muitas linhas de ônibus, mas carece de metrô.",
            "modes": {"metro": False, "bus": True, "bike": True},
        },
        "income_note": "a maior parte dos domicílios concentra mais de 6 a 7 salários mínimos",
        "leisure": [99, 99, 99, 97, 97, 94, 94, 93, 82],
        "infrastructure": ITENS_INFRAESTRUTURA[:5],
        "safety": {
            "values": [12, 30, 140, 8, 22, 135, 145],
            "summary": "Total de ocorrências é acima da média do DF",
            "note": "Atenção: Dados contemplam Asa Sul e Asa Norte (Plano Piloto)",
        },
    },
    {
        "id": "asa-sul",
        "name": "Asa Sul",
        "lat": -15.8160,
        "lng": -47.9000,
        "tags": ["Comércio", "Metrô", "Lazer"],
        "description": (
            "Primeira asa do Plano Piloto a ser ocupada, a Asa Sul combina "
            "superquadras arborizadas, comércio local tradicional e acesso direto "
            "ao metrô, com fácil ligação à Esplanada e ao centro de Brasília."
        ),
        "mobility": {
            "summary": "Atendida por metrô e por várias linhas de ônibus.",
            "modes": {"metro": True, "bus": True, "bike": True},
        },
        "safety": {
            "summary": "Total de ocorrências é acima da média do DF",
            "note": "Atenção: Dados contemplam Asa Sul e Asa Norte (Plano Piloto)",
        },
    },
    {
        "id": "taguatinga",
        "name": "Taguatinga",
        "lat": -15.8335,
        "lng": -48.0564,
        "tags": ["Comércio", "Metrô", "Custo acessível"],
        "description": (
            "Um dos maiores centros urbanos do DF, Taguatinga tem comércio forte, "
            "vida noturna movimentada e estações de metrô, sendo referência para "
            "quem busca serviços completos fora do Plano Piloto."
        ),
        "mobility": {
            "summary": "Tem metrô e muitas linhas de ônibus, com trânsito intenso.",
            "modes": {"metro": True, "bus": True, "bike": False},
        },
        "safety": {"summary": "Total de ocorrências é acima da média do DF"},
    },
    {
        "id": "guara",
        "name": "Guará",
        "lat": -15.8227,
        "lng": -47.9774,
        "tags": ["Metrô", "Feira", "Parques"],
        "description": (
            "Região tranquila e bem localizada entre o Plano Piloto e Taguatinga, "
            "o Guará é conhecido pela feira, pelos parques e pela boa oferta de "
            "transporte, com estações de metrô próximas."
        ),
        "mobility": {
            "summary": "Bem servido de ônibus e com estações de metrô próximas.",
            "modes": {"metro": True, "bus": True, "bike": True},
        },
        "safety": {"summary": "Total de ocorrências está na média do DF"},
    },
    {
        "id": "nucleo-bandeirante",
        "name": "Núcleo Bandeirante",
        "lat": -15.8710,
        "lng": -47.9670,
        "tags": ["Histórico", "Comércio", "Custo acessível"],
        "description": (
            "Uma das ocupações mais antigas do DF, o Núcleo Bandeirante nasceu "
            "como acampamento dos construtores de Brasília e hoje reúne comércio "
            "de rua, custo de vida menor e acesso rápido às principais vias."
        ),
        "mobility": {
            "summary": "Atendido por ônibus; não possui metrô.",
            "modes": {"metro": False, "bus": True, "bike": False},
        },
        "safety": {"summary": "Total de ocorrências está abaixo da média do DF"},
    },
]


def formatar_reais(valor: float) -> str:
    inteiro, centavos = f"{valor:.2f}".split(".")
    # Espaço não separável para "R$" não ficar sozinho no fim da linha.
    return f"R$\u00a0{int(inteiro):,}".replace(",", ".") + f",{centavos}"


def faixa_renda(posicao: int, total: int) -> str:
    if posicao < total / 3:
        return "alta"
    if posicao < 2 * total / 3:
        return "média"
    return "baixa"


def url_mapa(lat: float, lng: float, zoom: int = 14) -> str:
    """Tile do OpenStreetMap que contém o ponto. Imagem provisória até o mapa interativo."""
    n = 2**zoom
    x = int((lng + 180) / 360 * n)
    lat_rad = math.radians(lat)
    y = int((1 - math.asinh(math.tan(lat_rad)) / math.pi) / 2 * n)
    return f"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png"


def montar_perfil(regiao: dict) -> dict:
    rid = regiao["id"]
    rng = random.Random(rid)  # fictício, mas estável entre execuções

    lazer = regiao.get("leisure") or sorted(
        (rng.randint(55, 99) for _ in ITENS_LAZER), reverse=True
    )
    infraestrutura = regiao.get("infrastructure") or rng.sample(ITENS_INFRAESTRUTURA, 4)

    seguranca = regiao["safety"]
    valores_crime = seguranca.get("values") or [
        rng.randint(minimo, maximo) for _, minimo, maximo in CRIMES
    ]

    posicao = next(i for i, (codigo, _, _) in enumerate(RANKING_RENDA) if codigo == rid)
    renda = RANKING_RENDA[posicao][2]
    resumo_renda = (
        f"Comparado às demais RAs do DF, a {regiao['name']} está na faixa de renda "
        f"{faixa_renda(posicao, len(RANKING_RENDA))}. A renda domiciliar média mensal "
        f"gira em torno de {formatar_reais(renda)}"
    )
    if regiao.get("income_note"):
        resumo_renda += f" ({regiao['income_note']})"
    resumo_renda += "."

    fotos = [f"https://picsum.photos/seed/{rid}-{i}/800/600" for i in range(1, 8)]

    perfil = {
        "name": regiao["name"],
        "description": regiao["description"],
        "tags": regiao["tags"],
        "photos": fotos,
        "map_image_url": url_mapa(regiao["lat"], regiao["lng"]),
        "map_attribution": "© OpenStreetMap",
        "lat": regiao["lat"],
        "lng": regiao["lng"],
        "mobility": {**regiao["mobility"], "source": "STPC/DF 2026"},
        "leisure": {
            "items": [
                {"label": label, "percent": percent}
                for label, percent in zip(ITENS_LAZER, lazer)
            ],
            "source": "PDAD 2021",
        },
        "infrastructure": {"items": infraestrutura, "source": "PDAD 2021"},
        "income": {
            "summary": resumo_renda,
            "ranking": [
                {"region_id": codigo, "name": nome, "value": valor}
                for codigo, nome, valor in RANKING_RENDA
            ],
            "source": "PDAD 2024",
        },
        "safety": {
            "summary": seguranca["summary"],
            "crimes": [
                {"label": label, "value": valor}
                for (label, _, _), valor in zip(CRIMES, valores_crime)
            ],
            "ticks": TICKS_SEGURANCA,
            "source": "SSP-DF 2025, atualizados em 2026 · dados por tipo de crime",
        },
    }
    if seguranca.get("note"):
        perfil["safety"]["note"] = seguranca["note"]
    return perfil


def projeto_do_app() -> str | None:
    """Lê o projeto que o app usa (EXPO_PUBLIC_FIREBASE_PROJECT_ID do .env.local)."""
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
    try:
        with open(caminho, encoding="utf-8") as arquivo:
            for linha in arquivo:
                chave, _, valor = linha.strip().partition("=")
                if chave == "EXPO_PUBLIC_FIREBASE_PROJECT_ID" and valor:
                    return valor.strip().strip("'\"")
    except FileNotFoundError:
        pass
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--credenciais",
        default=os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
        help="JSON da service account. Sem ele, usa o login do gcloud "
        "(gcloud auth application-default login).",
    )
    parser.add_argument(
        "--projeto",
        default=projeto_do_app(),
        help="ID do projeto Firebase (padrão: o do .env.local do app).",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Imprime os documentos sem gravar."
    )
    args = parser.parse_args()

    perfis = {regiao["id"]: montar_perfil(regiao) for regiao in REGIOES}

    if args.dry_run:
        print(json.dumps(perfis, ensure_ascii=False, indent=2))
        return 0

    if not args.projeto:
        parser.error("informe --projeto (não encontrei EXPO_PUBLIC_FIREBASE_PROJECT_ID no .env.local).")

    import firebase_admin
    from firebase_admin import credentials, firestore

    # Sem chave, usa as Application Default Credentials do gcloud: útil quando a
    # organização bloqueia a criação de chaves de service account.
    credencial = (
        credentials.Certificate(args.credenciais)
        if args.credenciais
        else credentials.ApplicationDefault()
    )
    firebase_admin.initialize_app(credencial, {"projectId": args.projeto})
    db = firestore.client()

    batch = db.batch()
    for rid, perfil in perfis.items():
        batch.set(
            db.collection(COLECAO).document(rid),
            {**perfil, "updated_at": firestore.SERVER_TIMESTAMP},
        )
    batch.commit()

    print(f"{len(perfis)} regiões gravadas em {COLECAO} do projeto {args.projeto}: {', '.join(perfis)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
