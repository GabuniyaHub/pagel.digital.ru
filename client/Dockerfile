FROM nginx:alpine

# Удаляем дефолтные файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем СОДЕРЖИМОЕ папки pages в корень
COPY client/pages/ /usr/share/nginx/html/

# Копируем остальные папки
COPY client/assets/ /usr/share/nginx/html/assets/
COPY client/scripts/ /usr/share/nginx/html/scripts/

# Копируем nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Меняем права
RUN chown -R nginx:nginx /usr/share/nginx/html/ && \
    chmod -R 755 /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]