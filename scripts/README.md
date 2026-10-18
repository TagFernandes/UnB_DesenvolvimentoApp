# Seed das regiões

`seed_regioes.py` grava os perfis das RAs em `region_profiles/{regionId}`, que a
tela da RA e a aba Buscar leem. Os dados atuais são **fictícios** (a Asa Norte
segue o design); troque os valores no script quando os dados oficiais chegarem.

## Rodando

O script grava no projeto do app (`EXPO_PUBLIC_FIREBASE_PROJECT_ID` do
`.env.local`); use `--projeto` para outro.

### Sem chave (login do gcloud)

Use quando a organização bloqueia a criação de chaves de service account. A sua
conta Google precisa ter acesso ao projeto no Firebase.

```bash
brew install --cask google-cloud-sdk
gcloud auth application-default login
gcloud auth application-default set-quota-project mapeei-6fbea
python3 -m pip install -r scripts/requirements.txt
python3 scripts/seed_regioes.py
```

### Com chave de service account

Console do Firebase > Configurações do projeto > Contas de serviço > **Gerar nova
chave privada**. Salve o JSON fora do repositório (ou como `serviceAccount.json`,
que está no `.gitignore`) e rode:

```bash
python3 scripts/seed_regioes.py --credenciais /caminho/serviceAccount.json
```

Use `--dry-run` para ver o JSON sem gravar. Rodar de novo sobrescreve os
documentos, sem duplicar.

## Regras do Firestore

Adicione às regras (Console > Firestore > Regras). O app só lê os perfis; quem
grava é o script, pelo Admin SDK, que ignora as regras.

```
match /region_profiles/{regionId} {
  allow read: if request.auth != null;
  allow write: if false;
}

// dentro de match /users/{userId}
match /favorite_regions/{regionId} {
  allow read, delete: if signedIn() && request.auth.uid == userId;
  allow create: if signedIn()
    && request.auth.uid == userId
    && request.resource.data.keys().hasOnly(['region_id', 'created_at'])
    && request.resource.data.region_id == regionId
    && request.resource.data.created_at == request.time;
  allow update: if false;
}
```

## Formato de `region_profiles/{regionId}`

| Campo | Tipo |
| --- | --- |
| `name`, `description` | string |
| `tags`, `photos` | string[] (fotos são URLs) |
| `map_image_url`, `map_attribution` | string (imagem provisória até o mapa interativo) |
| `lat`, `lng` | number |
| `mobility` | `{ summary, modes: { metro, bus, bike }, source }` |
| `leisure` | `{ items: [{ label, percent }], source }` |
| `infrastructure` | `{ items: string[], source }` |
| `income` | `{ summary, ranking: [{ region_id, name, value }], source }` |
| `safety` | `{ summary, crimes: [{ label, value }], ticks: number[], source, note? }` |
