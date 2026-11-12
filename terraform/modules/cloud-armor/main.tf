# Cloud Armor Module for Unidad 3
# WAF (Web Application Firewall) con reglas OWASP Top 10 y Rate Limiting

# ============================================================
# SECURITY POLICY
# ============================================================
resource "google_compute_security_policy" "policy" {
  name        = var.policy_name
  description = "Cloud Armor Security Policy for ${var.project_name} - OWASP Top 10 + Rate Limiting"

  # Default rule - allow all (se sobrescribe con reglas específicas)
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule (lowest priority)"
  }

  # Rate limiting rule
  dynamic "rule" {
    for_each = var.enable_rate_limiting ? [1] : []
    content {
      action = "throttle"
      priority = 1000
      match {
        versioned_expr = "SRC_IPS_V1"
        config {
          src_ip_ranges = ["*"]
        }
      }
      description = "Rate limiting: ${var.rate_limit_threshold} req/min per IP"
      rate_limit_options {
        rate_limit_threshold = var.rate_limit_threshold
        enforce_on_key       = "IP"
        conform_action       = "allow"
        exceed_action        = "deny(429)"
      }
    }
  }

  # OWASP Top 10 Rules (Preconfigured WAF rules)
  dynamic "rule" {
    for_each = var.enable_owasp_rules ? [1] : []
    content {
      action = "deny(403)"
      priority = 1100
      match {
        versioned_expr = "OWASP"
        config {
          owasp_rules = [
            "owasp-crs-010001", # Protocol violations
            "owasp-crs-010002", # Protocol violations
            "owasp-crs-010003", # Protocol violations
            "owasp-crs-010004", # Protocol violations
            "owasp-crs-010005", # Protocol violations
            "owasp-crs-010006", # Protocol violations
            "owasp-crs-010007", # Protocol violations
            "owasp-crs-010008", # Protocol violations
            "owasp-crs-010009", # Protocol violations
            "owasp-crs-010010", # Protocol violations
            "owasp-crs-010011", # Protocol violations
            "owasp-crs-010012", # Protocol violations
            "owasp-crs-010013", # Protocol violations
            "owasp-crs-010014", # Protocol violations
            "owasp-crs-010015", # Protocol violations
            "owasp-crs-010016", # Protocol violations
            "owasp-crs-010017", # Protocol violations
            "owasp-crs-010018", # Protocol violations
            "owasp-crs-010019", # Protocol violations
            "owasp-crs-010020", # Protocol violations
            "owasp-crs-010021", # Protocol violations
            "owasp-crs-010022", # Protocol violations
            "owasp-crs-010023", # Protocol violations
            "owasp-crs-010024", # Protocol violations
            "owasp-crs-010025", # Protocol violations
            "owasp-crs-010026", # Protocol violations
            "owasp-crs-010027", # Protocol violations
            "owasp-crs-010028", # Protocol violations
            "owasp-crs-010029", # Protocol violations
            "owasp-crs-010030", # Protocol violations
            "owasp-crs-010031", # Protocol violations
            "owasp-crs-010032", # Protocol violations
            "owasp-crs-010033", # Protocol violations
            "owasp-crs-010034", # Protocol violations
            "owasp-crs-010035", # Protocol violations
            "owasp-crs-010036", # Protocol violations
            "owasp-crs-010037", # Protocol violations
            "owasp-crs-010038", # Protocol violations
            "owasp-crs-010039", # Protocol violations
            "owasp-crs-010040", # Protocol violations
            "owasp-crs-010041", # Protocol violations
            "owasp-crs-010042", # Protocol violations
            "owasp-crs-010043", # Protocol violations
            "owasp-crs-010044", # Protocol violations
            "owasp-crs-010045", # Protocol violations
            "owasp-crs-010046", # Protocol violations
            "owasp-crs-010047", # Protocol violations
            "owasp-crs-010048", # Protocol violations
            "owasp-crs-010049", # Protocol violations
            "owasp-crs-010050", # Protocol violations
            "owasp-crs-010051", # Protocol violations
            "owasp-crs-010052", # Protocol violations
            "owasp-crs-010053", # Protocol violations
            "owasp-crs-010054", # Protocol violations
            "owasp-crs-010055", # Protocol violations
            "owasp-crs-010056", # Protocol violations
            "owasp-crs-010057", # Protocol violations
            "owasp-crs-010058", # Protocol violations
            "owasp-crs-010059", # Protocol violations
            "owasp-crs-010060", # Protocol violations
            "owasp-crs-010061", # Protocol violations
            "owasp-crs-010062", # Protocol violations
            "owasp-crs-010063", # Protocol violations
            "owasp-crs-010064", # Protocol violations
            "owasp-crs-010065", # Protocol violations
            "owasp-crs-010066", # Protocol violations
            "owasp-crs-010067", # Protocol violations
            "owasp-crs-010068", # Protocol violations
            "owasp-crs-010069", # Protocol violations
            "owasp-crs-010070", # Protocol violations
            "owasp-crs-010071", # Protocol violations
            "owasp-crs-010072", # Protocol violations
            "owasp-crs-010073", # Protocol violations
            "owasp-crs-010074", # Protocol violations
            "owasp-crs-010075", # Protocol violations
            "owasp-crs-010076", # Protocol violations
            "owasp-crs-010077", # Protocol violations
            "owasp-crs-010078", # Protocol violations
            "owasp-crs-010079", # Protocol violations
            "owasp-crs-010080", # Protocol violations
            "owasp-crs-010081", # Protocol violations
            "owasp-crs-010082", # Protocol violations
            "owasp-crs-010083", # Protocol violations
            "owasp-crs-010084", # Protocol violations
            "owasp-crs-010085", # Protocol violations
            "owasp-crs-010086", # Protocol violations
            "owasp-crs-010087", # Protocol violations
            "owasp-crs-010088", # Protocol violations
            "owasp-crs-010089", # Protocol violations
            "owasp-crs-010090", # Protocol violations
            "owasp-crs-010091", # Protocol violations
            "owasp-crs-010092", # Protocol violations
            "owasp-crs-010093", # Protocol violations
            "owasp-crs-010094", # Protocol violations
            "owasp-crs-010095", # Protocol violations
            "owasp-crs-010096", # Protocol violations
            "owasp-crs-010097", # Protocol violations
            "owasp-crs-010098", # Protocol violations
            "owasp-crs-010099", # Protocol violations
            "owasp-crs-010100", # Protocol violations
            "owasp-crs-010101", # Protocol violations
            "owasp-crs-010102", # Protocol violations
            "owasp-crs-010103", # Protocol violations
            "owasp-crs-010104", # Protocol violations
            "owasp-crs-010105", # Protocol violations
            "owasp-crs-010106", # Protocol violations
            "owasp-crs-010107", # Protocol violations
            "owasp-crs-010108", # Protocol violations
            "owasp-crs-010109", # Protocol violations
            "owasp-crs-010110", # Protocol violations
            "owasp-crs-010111", # Protocol violations
            "owasp-crs-010112", # Protocol violations
            "owasp-crs-010113", # Protocol violations
            "owasp-crs-010114", # Protocol violations
            "owasp-crs-010115", # Protocol violations
            "owasp-crs-010116", # Protocol violations
            "owasp-crs-010117", # Protocol violations
            "owasp-crs-010118", # Protocol violations
            "owasp-crs-010119", # Protocol violations
            "owasp-crs-010120", # Protocol violations
            "owasp-crs-010121", # Protocol violations
            "owasp-crs-010122", # Protocol violations
            "owasp-crs-010123", # Protocol violations
            "owasp-crs-010124", # Protocol violations
            "owasp-crs-010125", # Protocol violations
            "owasp-crs-010126", # Protocol violations
            "owasp-crs-010127", # Protocol violations
            "owasp-crs-010128", # Protocol violations
            "owasp-crs-010129", # Protocol violations
            "owasp-crs-010130", # Protocol violations
            "owasp-crs-010131", # Protocol violations
            "owasp-crs-010132", # Protocol violations
            "owasp-crs-010133", # Protocol violations
            "owasp-crs-010134", # Protocol violations
            "owasp-crs-010135", # Protocol violations
            "owasp-crs-010136", # Protocol violations
            "owasp-crs-010137", # Protocol violations
            "owasp-crs-010138", # Protocol violations
            "owasp-crs-010139", # Protocol violations
            "owasp-crs-010140", # Protocol violations
            "owasp-crs-010141", # Protocol violations
            "owasp-crs-010141", # Protocol violations
            "owasp-crs-010142", # Protocol violations
            "owasp-crs-010143", # Protocol violations
            "owasp-crs-010144", # Protocol violations
            "owasp-crs-010145", # Protocol violations
            "owasp-crs-010146", # Protocol violations
            "owasp-crs-010147", # Protocol violations
            "owasp-crs-010148", # Protocol violations
            "owasp-crs-010149", # Protocol violations
            "owasp-crs-010150", # Protocol violations
            "owasp-crs-010151", # Protocol violations
            "owasp-crs-010152", # Protocol violations
            "owasp-crs-010153", # Protocol violations
            "owasp-crs-010154", # Protocol violations
            "owasp-crs-010155", # Protocol violations
            "owasp-crs-010155", # Protocol violations
            "owasp-crs-010156", # Protocol violations
            "owasp-crs-010157", # Protocol violations
            "owasp-crs-010158", # Protocol violations
            "owasp-crs-010159", # Protocol violations
            "owasp-crs-010160", # Protocol violations
            "owasp-crs-010161", # Protocol violations
            "owasp-crs-010162", # Protocol violations
            "owasp-crs-010163", # Protocol violations
            "owasp-crs-010164", # Protocol violations
            "owasp-crs-010165", # Protocol violations
            "owasp-crs-010166", # Protocol violations
            "owasp-crs-010167", # Protocol violations
            "owasp-crs-010168", # Protocol violations
            "owasp-crs-010169", # Protocol violations
            "owasp-crs-010170", # Protocol violations
            "owasp-crs-010171", # Protocol violations
            "owasp-crs-010172", # Protocol violations
            "owasp-crs-010173", # Protocol violations
            "owasp-crs-010174", # Protocol violations
            "owasp-crs-010175", # Protocol violations
            "owasp-crs-010176", # Protocol violations
            "owasp-crs-010177", # Protocol violations
            "owasp-crs-010177", # Protocol violations
            "owasp-crs-010178", # Protocol violations
            "owasp-crs-010179", # Protocol violations
            "owasp-crs-010180", # Protocol violations
            "owasp-crs-010181", # Protocol violations
            "owasp-crs-010182", # Protocol violations
            "owasp-crs-010183", # Protocol violations
            "owasp-crs-010184", # Protocol violations
            "owasp-crs-010185", # Protocol violations
            "owasp-crs-010186", # Protocol violations
            "owasp-crs-010187", # Protocol violations
            "owasp-crs-010188", # Protocol violations
            "owasp-crs-010189", # Protocol violations
            "owasp-crs-010189", # Protocol violations
            "owasp-crs-010190", # Protocol violations
            "owasp-crs-010191", # Protocol violations
            "owasp-crs-010192", # Protocol violations
            "owasp-crs-010193", # Protocol violations
            "owasp-crs-010194", # Protocol violations
            "owasp-crs-010195", # Protocol violations
            "owasp-crs-010196", # Protocol violations
            "owasp-crs-010197", # Protocol violations
            "owasp-crs-010198", # Protocol violations
            "owasp-crs-010199", # Protocol violations
            "owasp-crs-010200", # Protocol violations
            "owasp-crs-010201", # Protocol violations
            "owasp-crs-010202", # Protocol violations
            "owasp-crs-010203", # Protocol violations
            "owasp-crs-010204", # Protocol violations
            "owasp-crs-010205", # Protocol violations
            "owasp-crs-010206", # Protocol violations
            "owasp-crs-010207", # Protocol violations
            "owasp-crs-010208", # Protocol violations
            "owasp-crs-010209", # Protocol violations
            "owasp-crs-010210", # Protocol violations
            "owasp-crs-010211", # Protocol violations
            "owasp-crs-010212", # Protocol violations
            "owasp-crs-010213", # Protocol violations
            "owasp-crs-010214", # Protocol violations
            "owasp-crs-010215", # Protocol violations
            "owasp-crs-010216", # Protocol violations
            "owasp-crs-010217", # Protocol violations
            "owasp-crs-010218", # Protocol violations
            "owasp-crs-010219", # Protocol violations
            "owasp-crs-010220", # Protocol violations
            "owasp-crs-010221", # Protocol violations
            "owasp-crs-010222", # Protocol violations
            "owasp-crs-010223", # Protocol violations
            "owasp-crs-010224", # Protocol violations
            "owasp-crs-010225", # Protocol violations
            "owasp-crs-010226", # Protocol violations
            "owasp-crs-010227", # Protocol violations
            "owasp-crs-010228", # Protocol violations
            "owasp-crs-010229", # Protocol violations
            "owasp-crs-010230", # Protocol violations
            "owasp-crs-010231", # Protocol violations
            "owasp-crs-010232", # Protocol violations
            "owasp-crs-010233", # Protocol violations
            "owasp-crs-010234", # Protocol violations
            "owasp-crs-010235", # Protocol violations
            "owasp-crs-010236", # Protocol violations
            "owasp-crs-010237", # Protocol violations
            "owasp-crs-010238", # Protocol violations
            "owasp-crs-010239", # Protocol violations
            "owasp-crs-010240", # Protocol violations
            "owasp-crs-010241", # Protocol violations
            "owasp-crs-010242", # Protocol violations
            "owasp-crs-010243", # Protocol violations
            "owasp-crs-010244", # Protocol violations
            "owasp-crs-010245", # Protocol violations
            "owasp-crs-010246", # Protocol violations
            "owasp-crs-010247", # Protocol violations
            "owasp-crs-010248", # Protocol violations
            "owasp-crs-010249", # Protocol violations
            "owasp-crs-010250", # Protocol violations
            "owasp-crs-010251", # Protocol violations
            "owasp-crs-010252", # Protocol violations
            "owasp-crs-010253", # Protocol violations
            "owasp-crs-010254", # Protocol violations
            "owasp-crs-010255", # Protocol violations
            "owasp-crs-010256", # Protocol violations
            "owasp-crs-010257", # Protocol violations
            "owasp-crs-010258", # Protocol violations
            "owasp-crs-010259", # Protocol violations
            "owasp-crs-010260", # Protocol violations
            "owasp-crs-010261", # Protocol violations
            "owasp-crs-010262", # Protocol violations
            "owasp-crs-010263", # Protocol violations
            "owasp-crs-010264", # Protocol violations
            "owasp-crs-010265", # Protocol violations
            "owasp-crs-010266", # Protocol violations
            "owasp-crs-010267", # Protocol violations
            "owasp-crs-010268", # Protocol violations
            "owasp-crs-010269", # Protocol violations
            "owasp-crs-010270", # Protocol violations
            "owasp-crs-010271", # Protocol violations
            "owasp-crs-010272", # Protocol violations
            "owasp-crs-010273", # Protocol violations
            "owasp-crs-010274", # Protocol violations
            "owasp-crs-010275", # Protocol violations
            "owasp-crs-010276", # Protocol violations
            "owasp-crs-010277", # Protocol violations
            "owasp-crs-010278", # Protocol violations
            "owasp-crs-010279", # Protocol violations
            "owasp-crs-010280", # Protocol violations
            "owasp-crs-010281", # Protocol violations
            "owasp-crs-010282", # Protocol violations
            "owasp-crs-010283", # Protocol violations
            "owasp-crs-010284", # Protocol violations
            "owasp-crs-010285", # Protocol violations
            "owasp-crs-010286", # Protocol violations
            "owasp-crs-010287", # Protocol violations
            "owasp-crs-010288", # Protocol violations
            "owasp-crs-010289", # Protocol violations
            "owasp-crs-010290", # Protocol violations
            "owasp-crs-010291", # Protocol violations
            "owasp-crs-010292", # Protocol violations
            "owasp-crs-010293", # Protocol violations
            "owasp-crs-010294", # Protocol violations
            "owasp-crs-010295", # Protocol violations
            "owasp-crs-010296", # Protocol violations
            "owasp-crs-010297", # Protocol violations
            "owasp-crs-010298", # Protocol violations
            "owasp-crs-010299", # Protocol violations
            "owasp-crs-010300", # Protocol violations
          ]
        }
      }
      description = "OWASP CRS Ruleset"
    }
  }

  # Custom rules for specific protections
  rule {
    action   = "deny(403)"
    priority = 1200
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
      # Block requests with suspicious patterns
      expr {
        expression = "request.headers['user-agent'].contains('sqlmap') || request.headers['user-agent'].contains('nikto') || request.headers['user-agent'].contains('nmap')"
      }
    }
    description = "Block known scanner user agents"
  }

  rule {
    action   = "deny(403)"
    priority = 1201
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
      expr {
        expression = "request.path.contains('.git') || request.path.contains('.env') || request.path.contains('.htaccess') || request.path.contains('wp-admin') || request.path.contains('phpmyadmin')"
      }
    }
    description = "Block access to sensitive paths"
  }

  rule {
    action   = "deny(403)"
    priority = 1202
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
      expr {
        expression = "request.query.contains('union select') || request.query.contains('drop table') || request.query.contains('insert into') || request.query.contains('delete from') || request.query.contains('update set')"
      }
    }
    description = "Block SQL injection attempts in query params"
  }

  rule {
    action   = "deny(403)"
    priority = 1203
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
      expr {
        expression = "request.headers['x-forwarded-for'].contains('<script') || request.headers['referer'].contains('<script') || request.body.contains('<script')"
      }
    }
    description = "Block XSS attempts"
  }

  # Block TOR exit nodes (opcional)
  dynamic "rule" {
    for_each = var.block_tor ? [1] : []
    content {
      action   = "deny(403)"
      priority = 1300
      match {
        versioned_expr = "SRC_IPS_V1"
        config {
          src_ip_ranges = var.tor_exit_nodes
        }
      }
      description = "Block known TOR exit nodes"
    }
  }

  # Geo-blocking (opcional)
  dynamic "rule" {
    for_each = var.blocked_countries != null ? [1] : []
    content {
      action   = "deny(403)"
      priority = 1400
      match {
        versioned_expr = "SRC_IPS_V1"
        config {
          src_ip_ranges = var.blocked_countries
        }
      }
      description = "Block traffic from blocked countries"
    }
  }

  # Adaptive Protection (DDoS protection)
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable = true
    }
  }

  labels = var.labels
}

# ============================================================
# OUTPUTS
# ============================================================
output "security_policy_id" {
  value = google_compute_security_policy.policy.id
}

output "security_policy_name" {
  value = google_compute_security_policy.policy.name
}