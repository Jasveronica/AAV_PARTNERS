#!/usr/bin/env bash
set -e

echo "Clearing Laravel caches..."
php artisan optimize:clear

echo "Deployment preparation completed."
