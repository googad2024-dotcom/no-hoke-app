# Dockerfile（docker/php/Dockerfile）

FROM php:8.3-apache

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    && docker-php-ext-install pdo pdo_mysql zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN a2enmod rewrite

WORKDIR /var/www

# Apache設定
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/public\n\
    <Directory /var/www/public>\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf
