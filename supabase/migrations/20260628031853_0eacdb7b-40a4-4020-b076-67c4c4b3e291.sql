
ALTER TABLE public.contribuicoes
  ADD COLUMN IF NOT EXISTS comprovantes_pagamento_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recibos_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.contribuicoes
  DROP CONSTRAINT IF EXISTS contribuicoes_anexos_limite;
ALTER TABLE public.contribuicoes
  ADD CONSTRAINT contribuicoes_anexos_limite CHECK (
    array_length(comprovantes_pagamento_urls, 1) IS NULL OR array_length(comprovantes_pagamento_urls, 1) <= 2
  );
ALTER TABLE public.contribuicoes
  DROP CONSTRAINT IF EXISTS contribuicoes_recibos_limite;
ALTER TABLE public.contribuicoes
  ADD CONSTRAINT contribuicoes_recibos_limite CHECK (
    array_length(recibos_urls, 1) IS NULL OR array_length(recibos_urls, 1) <= 2
  );

ALTER TABLE public.solicitacoes_pagamento
  ADD COLUMN IF NOT EXISTS comprovantes_pagamento_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recibos_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.solicitacoes_pagamento
  DROP CONSTRAINT IF EXISTS solicitacoes_pagamento_anexos_limite;
ALTER TABLE public.solicitacoes_pagamento
  ADD CONSTRAINT solicitacoes_pagamento_anexos_limite CHECK (
    array_length(comprovantes_pagamento_urls, 1) IS NULL OR array_length(comprovantes_pagamento_urls, 1) <= 2
  );
ALTER TABLE public.solicitacoes_pagamento
  DROP CONSTRAINT IF EXISTS solicitacoes_pagamento_recibos_limite;
ALTER TABLE public.solicitacoes_pagamento
  ADD CONSTRAINT solicitacoes_pagamento_recibos_limite CHECK (
    array_length(recibos_urls, 1) IS NULL OR array_length(recibos_urls, 1) <= 2
  );
