INSERT INTO public.papeis_usuario (usuario_id, papel)
SELECT id, 'administrador'::app_role FROM public.usuarios
ON CONFLICT (usuario_id, papel) DO NOTHING;

UPDATE public.usuarios SET ativo = true WHERE ativo = false;