# Demo Data Generator

This backend command generates a realistic 3-month history for the textile ERP system.
It populates:

- Users and roles
- Warehouses and inventory flows
- Raw cotton intake and fiber/yarn production
- Tolling contracts, deliveries, invoices, and payments
- Financial transactions and expense events
- Notifications and operational alerts
- Exchange rate-derived finance entries

## Installation

Ensure the backend environment has `Faker` installed:

```bash
pip install Faker
```

If you manage dependencies through `backend/requirements.txt`, add:

```text
Faker==23.3.0
```

## Usage

From the `backend/` directory:

```bash
python manage.py generate_demo_data
```

Options:

```bash
python manage.py generate_demo_data --reset
python manage.py generate_demo_data --days 180
python manage.py generate_demo_data --seed 123456
```

- `--reset`: removes demo-generated records created by this command.
- `--days`: controls the date range of history (default `90`).
- `--seed`: makes generation repeatable.

## Notes

- The command is intentionally designed for local/demo databases.
- It uses isolated demo warehouse codes such as `DEM-WH-COT` and `DEM-WH-YRN`.
- The generated data is intended to produce meaningful dashboards and reports.
