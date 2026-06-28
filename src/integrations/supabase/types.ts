export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          acao: string
          data_hora: string
          detalhes: Json | null
          id: string
          modulo: string
          registro_id: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          data_hora?: string
          detalhes?: Json | null
          id?: string
          modulo: string
          registro_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          data_hora?: string
          detalhes?: Json | null
          id?: string
          modulo?: string
          registro_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          data_criacao: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_categoria"]
        }
        Insert: {
          ativo?: boolean
          data_criacao?: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_categoria"]
        }
        Update: {
          ativo?: boolean
          data_criacao?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
        }
        Relationships: []
      }
      contribuicoes: {
        Row: {
          comprovante_url: string | null
          comprovantes_pagamento_urls: string[]
          conferido_por: string | null
          criado_por: string
          data_conferencia: string | null
          data_criacao: string
          data_pagamento: string
          forma_pagamento: string
          id: string
          membro_nome: string
          observacao: string | null
          recibos_urls: string[]
          referencia_mes: string
          sociedade_id: string
          status_conferencia: Database["public"]["Enums"]["status_conferencia"]
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          comprovantes_pagamento_urls?: string[]
          conferido_por?: string | null
          criado_por: string
          data_conferencia?: string | null
          data_criacao?: string
          data_pagamento: string
          forma_pagamento: string
          id?: string
          membro_nome: string
          observacao?: string | null
          recibos_urls?: string[]
          referencia_mes: string
          sociedade_id: string
          status_conferencia?: Database["public"]["Enums"]["status_conferencia"]
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          comprovantes_pagamento_urls?: string[]
          conferido_por?: string | null
          criado_por?: string
          data_conferencia?: string | null
          data_criacao?: string
          data_pagamento?: string
          forma_pagamento?: string
          id?: string
          membro_nome?: string
          observacao?: string | null
          recibos_urls?: string[]
          referencia_mes?: string
          sociedade_id?: string
          status_conferencia?: Database["public"]["Enums"]["status_conferencia"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contribuicoes_conferido_por_fkey"
            columns: ["conferido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribuicoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribuicoes_sociedade_id_fkey"
            columns: ["sociedade_id"]
            isOneToOne: false
            referencedRelation: "sociedades"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_mensais: {
        Row: {
          ano: number
          conferido_por: string | null
          data_conferencia: string | null
          data_criacao: string
          data_envio: string | null
          enviado_por: string | null
          id: string
          mes: number
          observacao: string | null
          saldo_final: number
          saldo_inicial: number
          sociedade_id: string
          status: Database["public"]["Enums"]["status_fechamento"]
          total_entradas: number
          total_saidas: number
        }
        Insert: {
          ano: number
          conferido_por?: string | null
          data_conferencia?: string | null
          data_criacao?: string
          data_envio?: string | null
          enviado_por?: string | null
          id?: string
          mes: number
          observacao?: string | null
          saldo_final?: number
          saldo_inicial?: number
          sociedade_id: string
          status?: Database["public"]["Enums"]["status_fechamento"]
          total_entradas?: number
          total_saidas?: number
        }
        Update: {
          ano?: number
          conferido_por?: string | null
          data_conferencia?: string | null
          data_criacao?: string
          data_envio?: string | null
          enviado_por?: string | null
          id?: string
          mes?: number
          observacao?: string | null
          saldo_final?: number
          saldo_inicial?: number
          sociedade_id?: string
          status?: Database["public"]["Enums"]["status_fechamento"]
          total_entradas?: number
          total_saidas?: number
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_mensais_conferido_por_fkey"
            columns: ["conferido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_mensais_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_mensais_sociedade_id_fkey"
            columns: ["sociedade_id"]
            isOneToOne: false
            referencedRelation: "sociedades"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          banco: string | null
          categoria_id: string | null
          chave_pix: string | null
          cnpj: string | null
          data_criacao: string
          id: string
          nome_fantasia: string
          observacoes: string | null
          razao_social: string | null
        }
        Insert: {
          ativo?: boolean
          banco?: string | null
          categoria_id?: string | null
          chave_pix?: string | null
          cnpj?: string | null
          data_criacao?: string
          id?: string
          nome_fantasia: string
          observacoes?: string | null
          razao_social?: string | null
        }
        Update: {
          ativo?: boolean
          banco?: string | null
          categoria_id?: string | null
          chave_pix?: string | null
          cnpj?: string | null
          data_criacao?: string
          id?: string
          nome_fantasia?: string
          observacoes?: string | null
          razao_social?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_sociedade: {
        Row: {
          confirmada: boolean
          criado_por: string
          data_criacao: string
          data_movimento: string
          id: string
          observacao: string | null
          origem: string
          referencia_id: string | null
          sociedade_id: string
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          valor: number
        }
        Insert: {
          confirmada?: boolean
          criado_por: string
          data_criacao?: string
          data_movimento: string
          id?: string
          observacao?: string | null
          origem: string
          referencia_id?: string | null
          sociedade_id: string
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          valor: number
        }
        Update: {
          confirmada?: boolean
          criado_por?: string
          data_criacao?: string
          data_movimento?: string
          id?: string
          observacao?: string | null
          origem?: string
          referencia_id?: string | null
          sociedade_id?: string
          tipo?: Database["public"]["Enums"]["tipo_movimento"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_sociedade_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_sociedade_sociedade_id_fkey"
            columns: ["sociedade_id"]
            isOneToOne: false
            referencedRelation: "sociedades"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis_usuario: {
        Row: {
          data_criacao: string
          id: string
          papel: Database["public"]["Enums"]["app_role"]
          usuario_id: string
        }
        Insert: {
          data_criacao?: string
          id?: string
          papel: Database["public"]["Enums"]["app_role"]
          usuario_id: string
        }
        Update: {
          data_criacao?: string
          id?: string
          papel?: Database["public"]["Enums"]["app_role"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "papeis_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sociedades: {
        Row: {
          data_criacao: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_sociedade"]
          tipo: string
        }
        Insert: {
          data_criacao?: string
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["status_sociedade"]
          tipo: string
        }
        Update: {
          data_criacao?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_sociedade"]
          tipo?: string
        }
        Relationships: []
      }
      solicitacoes_pagamento: {
        Row: {
          anexo_comprovante_url: string | null
          anexo_nota_url: string | null
          categoria_id: string | null
          comprovantes_pagamento_urls: string[]
          conferido_por: string | null
          criado_por: string
          data_atualizacao: string
          data_criacao: string
          data_pagamento: string | null
          descricao: string
          fornecedor_id: string
          id: string
          motivo_recusa: string | null
          observacoes: string | null
          pago_por: string | null
          recibos_urls: string[]
          sociedade_id: string
          status: Database["public"]["Enums"]["status_solicitacao"]
          valor: number
          vencimento: string
        }
        Insert: {
          anexo_comprovante_url?: string | null
          anexo_nota_url?: string | null
          categoria_id?: string | null
          comprovantes_pagamento_urls?: string[]
          conferido_por?: string | null
          criado_por: string
          data_atualizacao?: string
          data_criacao?: string
          data_pagamento?: string | null
          descricao: string
          fornecedor_id: string
          id?: string
          motivo_recusa?: string | null
          observacoes?: string | null
          pago_por?: string | null
          recibos_urls?: string[]
          sociedade_id: string
          status?: Database["public"]["Enums"]["status_solicitacao"]
          valor: number
          vencimento: string
        }
        Update: {
          anexo_comprovante_url?: string | null
          anexo_nota_url?: string | null
          categoria_id?: string | null
          comprovantes_pagamento_urls?: string[]
          conferido_por?: string | null
          criado_por?: string
          data_atualizacao?: string
          data_criacao?: string
          data_pagamento?: string | null
          descricao?: string
          fornecedor_id?: string
          id?: string
          motivo_recusa?: string | null
          observacoes?: string | null
          pago_por?: string | null
          recibos_urls?: string[]
          sociedade_id?: string
          status?: Database["public"]["Enums"]["status_solicitacao"]
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_pagamento_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_pagamento_conferido_por_fkey"
            columns: ["conferido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_pagamento_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_pagamento_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_pagamento_pago_por_fkey"
            columns: ["pago_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_pagamento_sociedade_id_fkey"
            columns: ["sociedade_id"]
            isOneToOne: false
            referencedRelation: "sociedades"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          data_criacao: string
          email: string
          id: string
          nome: string
          sociedade_id: string | null
        }
        Insert: {
          ativo?: boolean
          data_criacao?: string
          email: string
          id: string
          nome: string
          sociedade_id?: string | null
        }
        Update: {
          ativo?: boolean
          data_criacao?: string
          email?: string
          id?: string
          nome?: string
          sociedade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_sociedade_id_fkey"
            columns: ["sociedade_id"]
            isOneToOne: false
            referencedRelation: "sociedades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_sociedade: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gestao: { Args: { _user_id: string }; Returns: boolean }
      mes_consolidado: {
        Args: { _data: string; _sociedade_id: string }
        Returns: boolean
      }
      reabrir_fechamento_consolidado: {
        Args: { _fechamento_id: string; _motivo: string }
        Returns: {
          ano: number
          conferido_por: string | null
          data_conferencia: string | null
          data_criacao: string
          data_envio: string | null
          enviado_por: string | null
          id: string
          mes: number
          observacao: string | null
          saldo_final: number
          saldo_inicial: number
          sociedade_id: string
          status: Database["public"]["Enums"]["status_fechamento"]
          total_entradas: number
          total_saidas: number
        }
        SetofOptions: {
          from: "*"
          to: "fechamentos_mensais"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "administrador"
        | "tesoureiro_igreja"
        | "tesoureiro_central"
        | "tesoureiro_sociedade"
      status_conferencia: "pendente" | "conferida" | "divergente"
      status_fechamento: "aberto" | "enviado" | "conferido" | "consolidado"
      status_sociedade: "ativa" | "inativa"
      status_solicitacao:
        | "rascunho"
        | "enviada"
        | "em_analise"
        | "aprovada"
        | "recusada"
        | "paga"
      tipo_categoria: "entrada" | "saida"
      tipo_movimento: "entrada" | "saida" | "ajuste"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrador",
        "tesoureiro_igreja",
        "tesoureiro_central",
        "tesoureiro_sociedade",
      ],
      status_conferencia: ["pendente", "conferida", "divergente"],
      status_fechamento: ["aberto", "enviado", "conferido", "consolidado"],
      status_sociedade: ["ativa", "inativa"],
      status_solicitacao: [
        "rascunho",
        "enviada",
        "em_analise",
        "aprovada",
        "recusada",
        "paga",
      ],
      tipo_categoria: ["entrada", "saida"],
      tipo_movimento: ["entrada", "saida", "ajuste"],
    },
  },
} as const
