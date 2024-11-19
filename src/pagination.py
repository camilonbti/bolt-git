class PaginationManager:
    def get_pagination(self, page, per_page, total_items, max_visible=7):
        """
        Calcula dados de paginação.
        
        Args:
            page: Página atual
            per_page: Itens por página
            total_items: Total de itens
            max_visible: Máximo de páginas visíveis na navegação
        """
        total_pages = (total_items + per_page - 1) // per_page
        page = min(max(1, page), total_pages)
        
        # Calcula índices de início e fim
        start = (page - 1) * per_page
        end = min(start + per_page, total_items)
        
        # Gera range de páginas visíveis
        if total_pages <= max_visible:
            pagination_range = range(1, total_pages + 1)
        else:
            # Sempre mostra primeira, última e páginas próximas à atual
            left_edge = 2
            right_edge = 2
            left_current = 2
            right_current = 2
            
            left_pages = set(range(1, left_edge + 1))
            right_pages = set(range(total_pages - right_edge + 1, total_pages + 1))
            current_pages = set(range(page - left_current, page + right_current + 1))
            
            pages = sorted(left_pages | current_pages | right_pages)
            
            # Adiciona elipses onde necessário
            pagination_range = []
            last = 0
            for p in pages:
                if p <= 0 or p > total_pages:
                    continue
                if last and p > last + 1:
                    pagination_range.append("...")
                pagination_range.append(p)
                last = p
        
        return {
            'total': total_items,
            'per_page': per_page,
            'current_page': page,
            'total_pages': total_pages,
            'start': start,
            'end': end,
            'pagination_range': pagination_range
        }