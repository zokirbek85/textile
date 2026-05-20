from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config


class Command(BaseCommand):
    help = "Create superuser from environment variables if it does not already exist."

    def handle(self, *args, **options):
        User = get_user_model()
        email = config("DJANGO_SUPERUSER_EMAIL", default="admin@textile.uz")
        username = config("DJANGO_SUPERUSER_USERNAME", default="admin")
        password = config("DJANGO_SUPERUSER_PASSWORD", default="Admin1234!")

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Superuser {email} already exists — skipping."))
            return

        User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
            first_name="System",
            last_name="Admin",
        )
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created successfully."))
