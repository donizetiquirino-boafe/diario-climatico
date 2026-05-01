import flet as ft
from supabase import create_client, Client
from datetime import datetime
import calendar
import pandas as pd
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

URL = "https://nqidjguwofidfxxiidwe.supabase.co"
KEY = "sb_publishable_co7vuzhbHU5rym-wBJFxyA_K6dA1J0b"

supabase: Client = create_client(URL, KEY)


def main(page: ft.Page):
    page.title = "Diário Climático"
    page.theme_mode = "dark"
    page.bgcolor = "#0B1120"
    page.padding = 12
    page.scroll = "auto"
    page.horizontal_alignment = "center"

    COR_FUNDO = "#0B1120"
    COR_CARD = "#151E32"
    COR_CARD2 = "#101827"
    COR_INPUT = "#1E2A40"
    COR_BORDA = "#2D3B55"
    COR_AZUL = "#00C6FF"
    COR_VERDE = "#22C55E"
    COR_VERMELHO = "#DC3545"
    COR_ROXO = "#A78BFA"
    COR_AMARELO = "#FBBF24"
    COR_TEXTO = "white"
    COR_MUTED = "#94A3B8"

    edit_id = {"id": None}

    # =========================
    # FUNÇÕES GERAIS
    # =========================
    def mostrar(msg, cor):
        snack = ft.SnackBar(ft.Text(msg, color="white"), bgcolor=cor)
        page.overlay.append(snack)
        snack.open = True
        page.update()

    def conv(v):
        if v is None or str(v).strip() == "":
            return 0
        numero = float(str(v).replace(",", ".").strip())
        return int(numero) if numero.is_integer() else numero

    def conv_opt(v):
        if v is None or str(v).strip() == "":
            return None
        return conv(v)

    def valor(v):
        return "-" if v is None else v

    def formatar_data(data):
        try:
            return datetime.strptime(str(data), "%Y-%m-%d").strftime("%d/%m/%Y")
        except:
            return str(data)

    def data_sql():
        return txt_data.value

    def buscar_dados(limite=1000):
        resp = (
            supabase
            .table("registros_clima")
            .select("id,data_registro,hora_leitura,temp_seca,temp_umida,umidade,temp_max,temp_min,chuva_mm,observacao")
            .order("data_registro", desc=True)
            .limit(limite)
            .execute()
        )
    
        return resp.data or []    
    def campo(label, expand=True):
        return ft.TextField(
            label=label,
            bgcolor=COR_INPUT,
            color="white",
            border_radius=12,
            border_color=COR_BORDA,
            focused_border_color=COR_AZUL,
            expand=expand,
        )

    def card(titulo, conteudo):
        return ft.Container(
            bgcolor=COR_CARD,
            padding=14,
            border_radius=18,
            border=ft.border.all(1, COR_BORDA),
            content=ft.Column(
                [
                    ft.Text(titulo, size=18, weight="bold", color=COR_TEXTO),
                    conteudo,
                ],
                spacing=10,
            ),
        )

    def botao(texto, cor, acao, expand=False):
        return ft.ElevatedButton(
            texto,
            bgcolor=cor,
            color="black" if cor != COR_VERMELHO else "white",
            height=52,
            on_click=acao,
            expand=expand,
        )

    # =========================
    # CALENDÁRIO
    # =========================
    def escolher_data(e):
        seletor_data.open = True
        page.update()

    class CalendarioCustomizado(ft.AlertDialog):
        def __init__(self, on_select, initial_date=None):
            super().__init__()
            self.on_select = on_select
            self.current_date = initial_date or datetime.now()
            self.view_year = self.current_date.year
            self.view_month = self.current_date.month
            
            self.meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
            self.dias_semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
            
            self.title_text = ft.Text("", size=18, weight="bold", color="white")
            self.grid_dias = ft.Column(spacing=10)
            
            self.bgcolor = "transparent"
            self.content_padding = 0
            self.inset_padding = 10
            self.title_padding = 0
            self.actions_padding = 0
            
            self.content = ft.Container(
                width=320,
                bgcolor=COR_CARD,
                padding=20,
                border_radius=18,
                border=ft.border.all(1, COR_BORDA),
                content=ft.Column(
                    [
                        ft.Row(
                            [
                                ft.Container(
                                    ft.Icon("chevron_left", color="white", size=20),
                                    width=35, height=35, border_radius=8, border=ft.border.all(1, COR_BORDA),
                                    alignment=ft.alignment.Alignment.CENTER, on_click=self.prev_month, ink=True
                                ),
                                self.title_text,
                                ft.Container(
                                    ft.Icon("chevron_right", color="white", size=20),
                                    width=35, height=35, border_radius=8, border=ft.border.all(1, COR_BORDA),
                                    alignment=ft.alignment.Alignment.CENTER, on_click=self.next_month, ink=True
                                ),
                            ],
                            alignment=ft.MainAxisAlignment.SPACE_BETWEEN
                        ),
                        ft.Container(height=5),
                        ft.Row(
                            [ft.Container(ft.Text(d, color=COR_MUTED, size=13), width=35, alignment=ft.alignment.Alignment.CENTER) for d in self.dias_semana],
                            alignment=ft.MainAxisAlignment.SPACE_BETWEEN
                        ),
                        self.grid_dias,
                        ft.Container(height=10),
                        ft.ElevatedButton(
                            "Fechar", 
                            width=320, 
                            bgcolor=COR_INPUT, 
                            color=COR_MUTED, 
                            height=45,
                            on_click=self.close_dialog,
                            style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=12))
                        )
                    ],
                    spacing=5,
                    tight=True
                )
            )
            self.update_calendar()

        def update_calendar(self):
            self.title_text.value = f"{self.meses[self.view_month - 1]} {self.view_year}"
            self.grid_dias.controls.clear()
            
            cal = calendar.Calendar(firstweekday=6)
            month_days = cal.monthdayscalendar(self.view_year, self.view_month)
            hoje = datetime.now()
            
            for week in month_days:
                row = ft.Row(alignment=ft.MainAxisAlignment.SPACE_BETWEEN)
                for day in week:
                    if day == 0:
                        row.controls.append(ft.Container(width=35, height=35))
                    else:
                        is_today = (day == hoje.day and self.view_month == hoje.month and self.view_year == hoje.year)
                        bg_color = COR_AZUL if is_today else "transparent"
                        text_color = "black" if is_today else "white"
                        
                        btn = ft.Container(
                            content=ft.Text(str(day), color=text_color, weight="bold" if is_today else "normal", size=15),
                            width=35,
                            height=35,
                            alignment=ft.alignment.Alignment.CENTER,
                            bgcolor=bg_color,
                            border_radius=8,
                            on_click=self.create_select_action(day),
                            ink=True
                        )
                        row.controls.append(btn)
                self.grid_dias.controls.append(row)
            try:
                self.update()
            except Exception:
                pass

        def create_select_action(self, day):
            def action(e):
                selected = datetime(self.view_year, self.view_month, day)
                self.open = False
                self.page.update()
                if self.on_select:
                    self.on_select(selected)
            return action

        def prev_month(self, e):
            if self.view_month == 1:
                self.view_month = 12
                self.view_year -= 1
            else:
                self.view_month -= 1
            self.update_calendar()
            
        def next_month(self, e):
            if self.view_month == 12:
                self.view_month = 1
                self.view_year += 1
            else:
                self.view_month += 1
            self.update_calendar()

        def close_dialog(self, e):
            self.open = False
            self.page.update()

    def data_selecionada(dt):
        if dt:
            txt_data.value = dt.strftime("%d/%m/%Y")
            page.update()

    seletor_data = CalendarioCustomizado(on_select=data_selecionada)
    page.overlay.append(seletor_data)

    def formatar_data_input(e):
        texto = e.control.value.replace("/", "")
        if not texto.isdigit() and texto != "":
            texto = "".join([c for c in texto if c.isdigit()])
        
        if len(texto) > 8:
            texto = texto[:8]
            
        if len(texto) > 4:
            e.control.value = f"{texto[:2]}/{texto[2:4]}/{texto[4:]}"
        elif len(texto) > 2:
            e.control.value = f"{texto[:2]}/{texto[2:]}"
        else:
            e.control.value = texto
            
        e.control.update()

    txt_data = ft.TextField(
        label="Data",
        value=datetime.now().strftime("%d/%m/%Y"),
        bgcolor=COR_INPUT,
        color="white",
        border_radius=12,
        border_color=COR_BORDA,
        focused_border_color=COR_AZUL,
        width=200,
        on_change=formatar_data_input,
    )

    btn_calendario = ft.ElevatedButton(
        "📅",
        bgcolor=COR_AZUL,
        color="black",
        width=56,
        height=55,
        on_click=escolher_data,
    )

    # =========================
    # CAMPOS - REGISTRO FIXO
    # =========================
    txt_seca_07 = campo("Seca")
    txt_umida_07 = campo("Úmida")
    txt_umidade_07 = campo("Relativa (%)")
    txt_max_07 = campo("Máxima")
    txt_min_07 = campo("Mínima")

    txt_seca_11 = campo("Seca")
    txt_umida_11 = campo("Úmida")
    txt_umidade_11 = campo("Relativa (%)")

    txt_seca_15 = campo("Seca")
    txt_umida_15 = campo("Úmida")
    txt_umidade_15 = campo("Relativa (%)")

    def formatar_hora(e):
        texto = e.control.value.replace(":", "")
        if not texto.isdigit() and texto != "":
            texto = "".join([c for c in texto if c.isdigit()])
        
        if len(texto) > 4:
            texto = texto[:4]
            
        if len(texto) > 2:
            e.control.value = f"{texto[:2]}:{texto[2:]}"
        else:
            e.control.value = texto
            
        e.control.update()

    txt_hora_chuva = ft.TextField(
        label="Horário (hh:mm)",
        bgcolor=COR_INPUT,
        color="white",
        border_radius=12,
        border_color=COR_BORDA,
        focused_border_color=COR_AZUL,
        expand=True,
        hint_text="00:00",
        on_change=formatar_hora,
    )
    txt_chuva_extra = campo("Volume chuva (mm)")
    txt_observacao = campo("Observação")

    # Campos usados ao editar registro individual
    dropdown_periodo_edit = ft.Dropdown(
        label="Horário",
        value="07:00",
        bgcolor=COR_INPUT,
        color="white",
        border_radius=12,
        border_color=COR_BORDA,
        options=[
            ft.dropdown.Option("07:00"),
            ft.dropdown.Option("11:00"),
            ft.dropdown.Option("15:00"),
            ft.dropdown.Option("Chuva Extra"),
        ],
    )

    txt_seca_edit = campo("Temp. Seca")
    txt_umida_edit = campo("Temp. Úmida")
    txt_umidade_edit = campo("Umidade (%)")
    txt_max_edit = campo("Máxima")
    txt_min_edit = campo("Mínima")
    txt_chuva_edit = campo("Chuva (mm)")
    txt_obs_edit = campo("Observação")

    # =========================
    # LIMPEZA
    # =========================
    def limpar_registro_geral():
        for c in [
            txt_seca_07, txt_umida_07, txt_umidade_07, txt_max_07, txt_min_07,
            txt_seca_11, txt_umida_11, txt_umidade_11,
            txt_seca_15, txt_umida_15, txt_umidade_15,
            txt_hora_chuva, txt_chuva_extra, txt_observacao
        ]:
            c.value = ""

    def limpar_edicao():
        edit_id["id"] = None
        btn_salvar_edit.text = "💾 SALVAR ALTERAÇÃO"
        for c in [txt_seca_edit, txt_umida_edit, txt_umidade_edit, txt_max_edit, txt_min_edit, txt_chuva_edit, txt_obs_edit]:
            c.value = ""

    # =========================
    # SALVAR REGISTROS FIXOS
    # =========================
    def criar_registro(hora, seca=None, umida=None, umidade=None, tmax=None, tmin=None, chuva=0, obs=""):
        return {
            "data_registro": data_sql(),
            "hora_leitura": hora,
            "temp_seca": seca,
            "temp_umida": umida,
            "umidade": umidade,
            "temp_max": tmax,
            "temp_min": tmin,
            "chuva_mm": chuva,
            "observacao": obs or "",
        }

    def salvar(e):
        try:
            registros = []
            obs = txt_observacao.value or ""

            if txt_seca_07.value or txt_umida_07.value or txt_umidade_07.value or txt_max_07.value or txt_min_07.value:
                registros.append(
                    criar_registro(
                        "07:00",
                        conv_opt(txt_seca_07.value),
                        conv_opt(txt_umida_07.value),
                        conv_opt(txt_umidade_07.value),
                        conv_opt(txt_max_07.value),
                        conv_opt(txt_min_07.value),
                        0,
                        obs,
                    )
                )

            if txt_seca_11.value or txt_umida_11.value or txt_umidade_11.value:
                registros.append(
                    criar_registro(
                        "11:00",
                        conv_opt(txt_seca_11.value),
                        conv_opt(txt_umida_11.value),
                        conv_opt(txt_umidade_11.value),
                        None,
                        None,
                        0,
                        obs,
                    )
                )

            if txt_seca_15.value or txt_umida_15.value or txt_umidade_15.value:
                registros.append(
                    criar_registro(
                        "15:00",
                        conv_opt(txt_seca_15.value),
                        conv_opt(txt_umida_15.value),
                        conv_opt(txt_umidade_15.value),
                        None,
                        None,
                        0,
                        obs,
                    )
                )

            if txt_chuva_extra.value:
                registros.append(
                    criar_registro(
                        txt_hora_chuva.value or "Chuva Extra",
                        None,
                        None,
                        None,
                        None,
                        None,
                        conv(txt_chuva_extra.value),
                        obs,
                    )
                )

            if not registros:
                mostrar("Nenhum dado informado.", COR_VERMELHO)
                return

            try:
                supabase.table("registros_clima").insert(registros).execute()
            except Exception as err:
                if "Expecting value" not in str(err):
                    raise err

            limpar_registro_geral()
            mostrar("Registros salvos com sucesso!", COR_VERDE)

        except Exception as err:
            mostrar(f"Erro ao salvar: {err}", COR_VERMELHO)

        page.update()

    # =========================
    # EDITAR / EXCLUIR
    # =========================
    def salvar_edicao(e):
        try:
            if edit_id["id"] is None:
                mostrar("Nenhum registro selecionado.", COR_VERMELHO)
                return

            periodo = dropdown_periodo_edit.value

            dados = {
                "data_registro": data_sql(),
                "hora_leitura": periodo,
                "temp_seca": None if periodo == "Chuva Extra" else conv_opt(txt_seca_edit.value),
                "temp_umida": None if periodo == "Chuva Extra" else conv_opt(txt_umida_edit.value),
                "umidade": None if periodo == "Chuva Extra" else conv_opt(txt_umidade_edit.value),
                "temp_max": conv_opt(txt_max_edit.value) if periodo == "07:00" else None,
                "temp_min": conv_opt(txt_min_edit.value) if periodo == "07:00" else None,
                "chuva_mm": conv(txt_chuva_edit.value),
                "observacao": txt_obs_edit.value or "",
            }

            supabase.table("registros_clima").update(dados).eq("id", edit_id["id"]).execute()
            limpar_edicao()
            mostrar("Registro atualizado!", COR_VERDE)
            carregar_registros()

        except Exception as err:
            mostrar(f"Erro ao atualizar: {err}", COR_VERMELHO)

    btn_salvar_edit = ft.ElevatedButton(
        "💾 SALVAR ALTERAÇÃO",
        bgcolor=COR_AZUL,
        color="black",
        height=55,
        on_click=salvar_edicao,
    )

    def carregar_para_editar(r):
        def acao(e):
            edit_id["id"] = r.get("id")
            txt_data.value = formatar_data(r.get("data_registro"))
            dropdown_periodo_edit.value = r.get("hora_leitura") or "07:00"
            txt_seca_edit.value = "" if r.get("temp_seca") is None else str(r.get("temp_seca"))
            txt_umida_edit.value = "" if r.get("temp_umida") is None else str(r.get("temp_umida"))
            txt_umidade_edit.value = "" if r.get("umidade") is None else str(r.get("umidade"))
            txt_max_edit.value = "" if r.get("temp_max") is None else str(r.get("temp_max"))
            txt_min_edit.value = "" if r.get("temp_min") is None else str(r.get("temp_min"))
            txt_chuva_edit.value = "" if r.get("chuva_mm") is None else str(r.get("chuva_mm"))
            txt_obs_edit.value = "" if r.get("observacao") is None else str(r.get("observacao"))
            mostrar_tela_edicao()

        return acao

    def excluir_registro(r):
        def acao(e):
            try:
                registro_id = r.get("id")
    
                if registro_id is None:
                    mostrar("Erro: ID do registro não encontrado.", COR_VERMELHO)
                    return
    
                supabase.table("registros_clima").delete().eq("id", registro_id).execute()
    
                mostrar("Registro excluído!", COR_VERDE)
                carregar_registros()
    
            except Exception as err:
                mostrar(f"Erro ao excluir: {err}", COR_VERMELHO)
    
        return acao

    # =========================
    # HISTÓRICO
    # =========================
    lista_registros = ft.Column(spacing=12)

    def montar_item_registro(r):
        return ft.Container(
            bgcolor=COR_CARD,
            padding=14,
            border_radius=16,
            border=ft.border.all(1, COR_BORDA),
            content=ft.Column(
                [
                    ft.Text(
                        f"📅 {formatar_data(r.get('data_registro'))}   🕒 {r.get('hora_leitura')}",
                        color="white",
                        weight="bold",
                        size=16,
                    ),
                    ft.Divider(color=COR_BORDA),
                    ft.Row(
                        [
                            ft.Text(f"🌡️ Seca: {valor(r.get('temp_seca'))}", color="white"),
                            ft.Text(f"💧 Úmida: {valor(r.get('temp_umida'))}", color="white"),
                        ],
                        spacing=18,
                    ),
                    ft.Text(f"💦 Relativa: {valor(r.get('umidade'))}%", color="white"),
                    ft.Row(
                        [
                            ft.Text(f"🔺 Máx: {valor(r.get('temp_max'))}", color="white"),
                            ft.Text(f"🔻 Mín: {valor(r.get('temp_min'))}", color="white"),
                        ],
                        spacing=18,
                    ),
                    ft.Text(f"🌧️ Chuva: {valor(r.get('chuva_mm'))} mm", color="white"),
                    ft.Text(f"📝 Obs: {valor(r.get('observacao'))}", color=COR_MUTED),
                    ft.Row(
                        [
                            ft.ElevatedButton("✏️ Editar", bgcolor=COR_AZUL, color="black", on_click=carregar_para_editar(r)),
                            ft.ElevatedButton("🗑 Excluir", bgcolor=COR_VERMELHO, color="white", on_click=excluir_registro(r)),
                        ],
                        spacing=10,
                    ),
                ],
                spacing=7,
            ),
        )

    def carregar_registros(e=None):
        try:
            lista_registros.controls.clear()
            lista_registros.controls.append(ft.Text("Carregando histórico...", color="white"))
            mostrar_tela_historico()

            dados = buscar_dados(100)
            lista_registros.controls.clear()

            if not dados:
                lista_registros.controls.append(ft.Text("Nenhum registro encontrado.", color="white"))
            else:
                data_atual = None
                for r in dados:
                    data_fmt = formatar_data(r.get("data_registro"))
                    if data_fmt != data_atual:
                        data_atual = data_fmt
                        lista_registros.controls.append(
                            ft.Text(f"📌 {data_fmt}", color=COR_AZUL, size=20, weight="bold")
                        )
                    lista_registros.controls.append(montar_item_registro(r))

        except Exception as err:
            mostrar(f"Erro ao carregar histórico: {err}", COR_VERMELHO)

        page.update()

    # =========================
    # GRÁFICOS
    # =========================
    grafico_container = ft.Row(scroll=ft.ScrollMode.AUTO, spacing=12, run_spacing=12, alignment=ft.MainAxisAlignment.START)

    def barra_grafico(titulo, valor_barra, maximo, cor):
        try:
            valor_num = float(valor_barra or 0)
        except:
            valor_num = 0

        proporcao = valor_num / maximo if maximo > 0 else 0
        if proporcao > 1:
            proporcao = 1

        return ft.Column(
            [
                ft.Row(
                    [
                        ft.Text(titulo, color="white", size=14, weight="w500", expand=True),
                        ft.Text(f"{valor_num}", color=COR_MUTED, size=14, weight="w600"),
                    ]
                ),
                ft.ProgressBar(
                    value=proporcao,
                    color=cor,
                    bgcolor="#263449",
                    height=10,
                    border_radius=5,
                ),
            ],
            spacing=6,
        )

    def carregar_graficos(e=None):
        try:
            grafico_container.controls.clear()
            grafico_container.controls.append(ft.Text("Carregando gráficos...", color="white"))
            mostrar_tela_graficos()

            dados = buscar_dados(30)
            grafico_container.controls.clear()

            if not dados:
                grafico_container.controls.append(ft.Text("Nenhum dado encontrado.", color="white"))
            else:
                for r in dados:
                    titulo = f"{formatar_data(r.get('data_registro'))} - {r.get('hora_leitura')}"
                    grafico_container.controls.append(
                        ft.Container(
                            width=335,
                            bgcolor=COR_CARD,
                            padding=14,
                            border_radius=16,
                            border=ft.border.all(1, COR_BORDA),
                            content=ft.Column(
                                [
                                    ft.Text(titulo, color="white", weight="bold", size=15),
                                    barra_grafico("🌡️ Temp. seca", r.get("temp_seca"), 50, COR_AZUL),
                                    barra_grafico("💧 Temp. úmida", r.get("temp_umida"), 50, COR_VERDE),
                                    barra_grafico("💦 Umidade relativa", r.get("umidade"), 100, "#60A5FA"),
                                    barra_grafico("🌧️ Chuva mm", r.get("chuva_mm"), 100, COR_ROXO),
                                ],
                                spacing=9,
                            ),
                        )
                    )

        except Exception as err:
            mostrar(f"Erro ao carregar gráficos: {err}", COR_VERMELHO)

        page.update()

    # =========================
    # DASHBOARD
    # =========================
    dashboard_container = ft.Column(spacing=12)

    def media(lista):
        nums = [float(x) for x in lista if x is not None]
        return round(sum(nums) / len(nums), 2) if nums else 0

    def soma(lista):
        nums = [float(x) for x in lista if x is not None]
        return round(sum(nums), 2) if nums else 0

    def card_metrica(titulo, valor_metrica, subtitulo, icone="📊", cor_icone=COR_AZUL):
        return ft.Container(
            bgcolor=COR_CARD,
            padding=18,
            border_radius=16,
            border=ft.border.all(1, COR_BORDA),
            expand=True,
            content=ft.Column(
                [
                    ft.Row(
                        [
                            ft.Text(icone, size=20, color=cor_icone),
                            ft.Text(titulo, color=COR_MUTED, size=13, weight="bold"),
                        ],
                        alignment=ft.MainAxisAlignment.START,
                        spacing=8,
                    ),
                    ft.Text(str(valor_metrica), color="white", size=28, weight="bold"),
                    ft.Text(subtitulo, color=COR_MUTED, size=11),
                ],
                spacing=5,
            ),
        )

    def carregar_dashboard(e=None):
        try:
            dashboard_container.controls.clear()
            dashboard_container.controls.append(ft.Text("Carregando dashboard...", color="white"))
            mostrar_tela_dashboard()

            dados = buscar_dados(300)
            dashboard_container.controls.clear()

            if not dados:
                dashboard_container.controls.append(ft.Text("Nenhum dado encontrado.", color="white"))
            else:
                media_seca = media([r.get("temp_seca") for r in dados])
                media_umida = media([r.get("temp_umida") for r in dados])
                media_umidade = media([r.get("umidade") for r in dados])
                total_chuva = soma([r.get("chuva_mm") for r in dados])

                dashboard_container.controls.extend(
                    [
                        ft.Row(
                            [
                                card_metrica("Média Temp. Seca", f"{media_seca} °C", "base últimos registros", "🌡️", COR_AZUL),
                                card_metrica("Média Temp. Úmida", f"{media_umida} °C", "base últimos registros", "💧", COR_VERDE),
                            ],
                            spacing=12,
                        ),
                        ft.Row(
                            [
                                card_metrica("Média Umidade", f"{media_umidade}%", "base últimos registros", "💦", "#60A5FA"),
                                card_metrica("Total de Chuva", f"{total_chuva} mm", "acumulado", "🌧️", COR_ROXO),
                            ],
                            spacing=12,
                        ),
                        ft.Container(height=10),
                        ft.Text("📈 Tendência recente", color="white", size=19, weight="bold"),
                    ]
                )

                tendencia_row = ft.Row(scroll=ft.ScrollMode.AUTO, spacing=12, run_spacing=12, alignment=ft.MainAxisAlignment.START)
                
                for r in list(reversed(dados[:7])):
                    tendencia_row.controls.append(
                        ft.Container(
                            width=335,
                            bgcolor=COR_CARD,
                            padding=12,
                            border_radius=14,
                            border=ft.border.all(1, COR_BORDA),
                            content=ft.Column(
                                [
                                    ft.Text(f"{formatar_data(r.get('data_registro'))} - {r.get('hora_leitura')}", color="white", weight="bold"),
                                    barra_grafico("Temp. seca", r.get("temp_seca"), 50, COR_AZUL),
                                    barra_grafico("Chuva", r.get("chuva_mm"), 100, COR_ROXO),
                                ],
                                spacing=7,
                            ),
                        )
                    )
                
                dashboard_container.controls.append(tendencia_row)

        except Exception as err:
            mostrar(f"Erro no dashboard: {err}", COR_VERMELHO)

        page.update()

    # =========================
    # EXCEL E PDF
    # =========================
    def exportar_excel(e=None):
        try:
            dados = buscar_dados(1000)
            if not dados:
                mostrar("Nenhum registro para exportar.", COR_VERMELHO)
                return

            df = pd.DataFrame(dados)
            caminho = "relatorio_clima.xlsx"
            df.to_excel(caminho, index=False)

            mostrar(f"Excel gerado: {caminho}", COR_VERDE)

        except Exception as err:
            mostrar(f"Erro Excel: {err}", COR_VERMELHO)

    def gerar_pdf(e=None):
        try:
            dados = buscar_dados(200)
            if not dados:
                mostrar("Nenhum registro para gerar PDF.", COR_VERMELHO)
                return

            caminho = "relatorio_clima.pdf"
            doc = SimpleDocTemplate(caminho, pagesize=landscape(A4))
            styles = getSampleStyleSheet()
            elementos = []

            elementos.append(Paragraph("Relatório Climático", styles["Title"]))
            elementos.append(Spacer(1, 12))

            tabela = [["Data", "Hora", "Seca", "Úmida", "Umidade", "Máx", "Mín", "Chuva", "Obs"]]

            for r in dados:
                tabela.append(
                    [
                        formatar_data(r.get("data_registro")),
                        r.get("hora_leitura"),
                        valor(r.get("temp_seca")),
                        valor(r.get("temp_umida")),
                        valor(r.get("umidade")),
                        valor(r.get("temp_max")),
                        valor(r.get("temp_min")),
                        valor(r.get("chuva_mm")),
                        valor(r.get("observacao")),
                    ]
                )

            tbl = Table(tabela, repeatRows=1)
            tbl.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#151E32")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 7),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ]
                )
            )

            elementos.append(tbl)
            doc.build(elementos)

            mostrar(f"PDF gerado: {caminho}", COR_VERDE)

        except Exception as err:
            mostrar(f"Erro PDF: {err}", COR_VERMELHO)

    # =========================
    # NAVEGAÇÃO
    # =========================
    def mostrar_tela_registrar(e=None):
        page.controls.clear()
        page.add(ft.Container(tela_registrar, width=700))
        page.update()

    def mostrar_tela_historico(e=None):
        page.controls.clear()
        page.add(ft.Container(tela_historico, width=700))
        page.update()

    def mostrar_tela_graficos(e=None):
        page.controls.clear()
        page.add(ft.Container(tela_graficos, width=700))
        page.update()

    def mostrar_tela_dashboard(e=None):
        page.controls.clear()
        page.add(ft.Container(tela_dashboard, width=700))
        page.update()

    def mostrar_tela_edicao(e=None):
        page.controls.clear()
        page.add(ft.Container(tela_edicao, width=700))
        page.update()

    # =========================
    # COMPONENTES VISUAIS
    # =========================
    def menu_topo(ativo):
        def aba(titulo, tela, ativo_nome):
            cor = COR_AZUL if ativo == ativo_nome else COR_CARD2
            return ft.ElevatedButton(
                titulo,
                bgcolor=cor,
                color="black" if ativo == ativo_nome else COR_MUTED,
                height=50,
                on_click=tela,
                expand=True,
            )

        return ft.Container(
            bgcolor=COR_CARD2,
            border_radius=18,
            padding=8,
            content=ft.Row(
                [
                    aba("✏️ Registrar", mostrar_tela_registrar, "registrar"),
                    aba("📋 Histórico", carregar_registros, "historico"),
                    aba("📈 Gráficos", carregar_graficos, "graficos"),
                    aba("📊 Dashboard", carregar_dashboard, "dashboard"),
                ],
                spacing=8,
                scroll=ft.ScrollMode.AUTO,
            ),
        )

    btn_salvar = botao("💾 SALVAR REGISTROS", COR_AZUL, salvar, expand=True)
    btn_excel = botao("📊 EXPORTAR EXCEL", COR_VERDE, exportar_excel, expand=True)
    btn_pdf = botao("📄 GERAR PDF", COR_VERMELHO, gerar_pdf, expand=True)

    btn_atualizar_hist = botao("🔄 ATUALIZAR", COR_VERDE, carregar_registros)
    btn_atualizar_graf = botao("🔄 ATUALIZAR", COR_VERDE, carregar_graficos)
    btn_atualizar_dash = botao("🔄 ATUALIZAR", COR_VERDE, carregar_dashboard)

    # =========================
    # TELAS E ABAS
    # =========================
    def selecionar_aba(aba):
        card_07.visible = (aba == "07:00")
        card_11.visible = (aba == "11:00")
        card_15.visible = (aba == "15:00")
        
        btn_aba_07.bgcolor = COR_AZUL if aba == "07:00" else "transparent"
        btn_aba_07.color = "black" if aba == "07:00" else "white"
        
        btn_aba_11.bgcolor = COR_AZUL if aba == "11:00" else "transparent"
        btn_aba_11.color = "black" if aba == "11:00" else "white"
        
        btn_aba_15.bgcolor = COR_AZUL if aba == "15:00" else "transparent"
        btn_aba_15.color = "black" if aba == "15:00" else "white"
        
        page.update()

    btn_aba_07 = ft.ElevatedButton("07:00", bgcolor=COR_AZUL, color="black", height=55, on_click=lambda e: selecionar_aba("07:00"), style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=12), side=ft.BorderSide(1, COR_BORDA)))
    btn_aba_11 = ft.ElevatedButton("11:00", bgcolor="transparent", color="white", height=55, on_click=lambda e: selecionar_aba("11:00"), style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=12), side=ft.BorderSide(1, COR_BORDA)))
    btn_aba_15 = ft.ElevatedButton("15:00", bgcolor="transparent", color="white", height=55, on_click=lambda e: selecionar_aba("15:00"), style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=12), side=ft.BorderSide(1, COR_BORDA)))

    card_07 = card(
        "🌡️ Temperatura / Umidade - 07:00",
        ft.Column(
            [
                ft.ResponsiveRow([ft.Container(txt_seca_07, col={"xs": 12, "sm": 4}), ft.Container(txt_umida_07, col={"xs": 12, "sm": 4}), ft.Container(txt_umidade_07, col={"xs": 12, "sm": 4})]),
                ft.Text("Extremas", color=COR_MUTED, weight="bold"),
                ft.ResponsiveRow([ft.Container(txt_max_07, col={"xs": 12, "sm": 6}), ft.Container(txt_min_07, col={"xs": 12, "sm": 6})]),
            ],
            spacing=10,
        ),
    )
    
    card_11 = card(
        "🌡️ Temperatura / Umidade - 11:00",
        ft.ResponsiveRow([ft.Container(txt_seca_11, col={"xs": 12, "sm": 4}), ft.Container(txt_umida_11, col={"xs": 12, "sm": 4}), ft.Container(txt_umidade_11, col={"xs": 12, "sm": 4})]),
    )
    card_11.visible = False

    card_15 = card(
        "🌡️ Temperatura / Umidade - 15:00",
        ft.ResponsiveRow([ft.Container(txt_seca_15, col={"xs": 12, "sm": 4}), ft.Container(txt_umida_15, col={"xs": 12, "sm": 4}), ft.Container(txt_umidade_15, col={"xs": 12, "sm": 4})]),
    )
    card_15.visible = False

    tela_registrar = ft.Column(
        [
            ft.Text("🌡️ Diário Climático", size=25, weight="bold", color="white"),
            menu_topo("registrar"),

            card(
                "📅 Data do Registro",
                ft.Row([txt_data, btn_calendario, ft.Container(width=20), btn_aba_07, btn_aba_11, btn_aba_15], spacing=8, wrap=True),
            ),

            card_07,
            card_11,
            card_15,

            card(
                "🌧️ Registro de Chuvas",
                ft.ResponsiveRow([ft.Container(txt_hora_chuva, col={"xs": 12, "sm": 6}), ft.Container(txt_chuva_extra, col={"xs": 12, "sm": 6})]),
            ),

            card("📝 Observação", txt_observacao),

            ft.ResponsiveRow([ft.Container(btn_salvar, col={"xs": 12, "sm": 4}), ft.Container(btn_excel, col={"xs": 12, "sm": 4}), ft.Container(btn_pdf, col={"xs": 12, "sm": 4})]),
        ],
        spacing=14,
    )

    tela_historico = ft.Column(
        [
            ft.Text("📋 Histórico", size=25, weight="bold", color="white"),
            menu_topo("historico"),
            btn_atualizar_hist,
            lista_registros,
        ],
        spacing=14,
    )

    tela_graficos = ft.Column(
        [
            ft.Text("📈 Gráficos", size=25, weight="bold", color="white"),
            menu_topo("graficos"),
            btn_atualizar_graf,
            grafico_container,
        ],
        spacing=14,
    )

    tela_dashboard = ft.Column(
        [
            ft.Text("📊 Dashboard", size=25, weight="bold", color="white"),
            menu_topo("dashboard"),
            btn_atualizar_dash,
            dashboard_container,
        ],
        spacing=14,
    )

    tela_edicao = ft.Column(
        [
            ft.Text("✏️ Editar Registro", size=25, weight="bold", color="white"),
            menu_topo("historico"),
            card("Data", ft.Row([txt_data, btn_calendario], spacing=8)),
            card(
                "Dados do Registro",
                ft.Column(
                    [
                        dropdown_periodo_edit,
                        ft.Row([txt_seca_edit, txt_umida_edit, txt_umidade_edit], spacing=8),
                        ft.Row([txt_max_edit, txt_min_edit], spacing=8),
                        ft.Row([txt_chuva_edit, txt_obs_edit], spacing=8),
                    ],
                    spacing=10,
                ),
            ),
            btn_salvar_edit,
        ],
        spacing=14,
    )

    mostrar_tela_registrar()


import os
porta = int(os.environ.get("PORT", 8550))
ft.app(target=main, view=ft.AppView.WEB_BROWSER, host="0.0.0.0", port=porta)