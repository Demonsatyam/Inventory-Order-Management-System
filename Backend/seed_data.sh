#!/usr/bin/env bash
# Seed the running API with dummy data. Prices are in Indian Rupees (INR).
# Usage:  bash Backend/seed_data.sh   (backend must be up on localhost:8000)
set -euo pipefail

API="${API_URL:-http://localhost:8000}"

# Pull the "id" out of a JSON response body.
id_of() { grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*'; }

post() { curl -s -X POST "$API$1" -H "Content-Type: application/json" -d "$2"; }

echo "Seeding products (prices in ₹)..."
# name | sku | price(INR) | stock
products=(
  "Wireless Mouse|MOU-001|599|150"
  "Mechanical Keyboard|KEY-001|2999|80"
  "USB-C Charger 65W|CHG-065|1499|200"
  "Laptop Backpack|BAG-001|1299|120"
  "HD Webcam 1080p|CAM-108|1999|60"
  "Bluetooth Speaker|SPK-001|2499|90"
  "Power Bank 20000mAh|PWR-200|1799|140"
  "Smartwatch Series 5|WAT-005|4999|50"
  "Noise Cancelling Headphones|HPH-001|7999|40"
  "Ergonomic Office Chair|CHR-001|8499|25"
  # --- Low-stock items (stock < 10) to trigger the dashboard alert ---
  "HDMI Cable 2m|CBL-002|349|7"
  "Wireless Earbuds|EAR-001|3499|4"
  "Adjustable Laptop Stand|STD-001|1199|2"
  "Gaming Mousepad XL|PAD-001|799|9"
  "4K Monitor 27 inch|MON-027|18999|0"
)
declare -a PID
i=0
for p in "${products[@]}"; do
  IFS='|' read -r name sku price stock <<< "$p"
  body=$(printf '{"name":"%s","sku":"%s","price":%s,"stock_quantity":%s}' "$name" "$sku" "$price" "$stock")
  PID[$i]=$(post /products "$body" | id_of)
  echo "  #${PID[$i]}  $name  -  ₹$price  ($stock in stock)"
  i=$((i+1))
done

echo "Seeding customers..."
# full_name | email | phone
customers=(
  "Aarav Sharma|aarav.sharma@example.com|+91 98765 43210"
  "Diya Patel|diya.patel@example.com|+91 91234 56789"
  "Rohan Verma|rohan.verma@example.com|+91 99887 76655"
  "Ananya Iyer|ananya.iyer@example.com|+91 90123 45678"
  "Kabir Singh|kabir.singh@example.com|+91 93456 78901"
)
declare -a CID
i=0
for c in "${customers[@]}"; do
  IFS='|' read -r name email phone <<< "$c"
  body=$(printf '{"full_name":"%s","email":"%s","phone":"%s"}' "$name" "$email" "$phone")
  CID[$i]=$(post /customers "$body" | id_of)
  echo "  #${CID[$i]}  $name  ($email)"
  i=$((i+1))
done

echo "Seeding orders (backend computes totals from product prices)..."
mk_order() {
  local cust=$1; shift
  local items="$*"
  post /orders "$(printf '{"customer_id":%s,"items":[%s]}' "$cust" "$items")"
}

# Helper to build an item line: item <product_id> <qty>
item() { printf '{"product_id":%s,"quantity":%s}' "$1" "$2"; }

o1=$(mk_order "${CID[0]}" "$(item "${PID[0]}" 2),$(item "${PID[1]}" 1)")
echo "  Order #$(echo "$o1" | id_of) for Aarav  -  total ₹$(echo "$o1" | grep -o '"total_amount":"[0-9.]*"' | grep -o '[0-9.]*')"

o2=$(mk_order "${CID[1]}" "$(item "${PID[7]}" 1),$(item "${PID[2]}" 1)")
echo "  Order #$(echo "$o2" | id_of) for Diya   -  total ₹$(echo "$o2" | grep -o '"total_amount":"[0-9.]*"' | grep -o '[0-9.]*')"

o3=$(mk_order "${CID[2]}" "$(item "${PID[8]}" 1)")
echo "  Order #$(echo "$o3" | id_of) for Rohan  -  total ₹$(echo "$o3" | grep -o '"total_amount":"[0-9.]*"' | grep -o '[0-9.]*')"

o4=$(mk_order "${CID[3]}" "$(item "${PID[5]}" 2),$(item "${PID[6]}" 1),$(item "${PID[0]}" 3)")
echo "  Order #$(echo "$o4" | id_of) for Ananya -  total ₹$(echo "$o4" | grep -o '"total_amount":"[0-9.]*"' | grep -o '[0-9.]*')"

o5=$(mk_order "${CID[4]}" "$(item "${PID[9]}" 1),$(item "${PID[4]}" 1)")
echo "  Order #$(echo "$o5" | id_of) for Kabir  -  total ₹$(echo "$o5" | grep -o '"total_amount":"[0-9.]*"' | grep -o '[0-9.]*')"

echo "Done. Open http://localhost:3000 to see the data."
