#!/usr/bin/env bash
set -e

echo "Installing Laravel dependencies..."
composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

echo "Clearing Laravel caches..."
php artisan optimize:clear

echo "Deployment preparation completed."
