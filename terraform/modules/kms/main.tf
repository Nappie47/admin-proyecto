# Cloud KMS Module for Unidad 3
# Crea Key Ring y CryptoKeys para CMEK (Customer Managed Encryption Keys)

# ============================================================
# KEY RING
# ============================================================
resource "google_kms_key_ring" "keyring" {
  name     = var.key_ring_name
  location = var.region

  labels = var.labels
}

# ============================================================
# CRYPTO KEYS
# ============================================================
resource "google_kms_crypto_key" "keys" {
  for_each = var.keys

  name            = "${var.key_ring_name}-${each.key}"
  key_ring        = google_kms_key_ring.keyring.id
  purpose         = each.value.purpose
  destroy_scheduled_duration = "2592000s" # 30 días antes de destrucción

  # Rotación automática
  rotation_period = each.value.rotation_period

  # Configuración de versión
  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "SOFTWARE"
  }

  labels = merge(var.labels, { purpose = each.key })
}

# ============================================================
# IAM BINDINGS PARA KEYS
# ============================================================
resource "google_kms_crypto_key_iam_binding" "key_user" {
  for_each = var.keys

  crypto_key_id = google_kms_crypto_key.keys[each.key].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  members       = each.value.iam_members != null ? each.value.iam_members : []
}

# ============================================================
# OUTPUTS
# ============================================================
output "key_ring_id" {
  value = google_kms_key_ring.keyring.id
}

output "key_ring_name" {
  value = google_kms_key_ring.keyring.name
}

output "keys" {
  value = {
    for key, key_resource in google_kms_crypto_key.keys :
    key => {
      id    = key_resource.id
      name  = key_resource.name
      self_link = key_resource.self_link
    }
  }
}