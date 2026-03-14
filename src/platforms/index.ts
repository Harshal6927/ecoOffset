/**
 * Platform registry — detects the active shopping platform from the current URL.
 *
 * To add a new platform:
 *  1. Create a new file in src/platforms/ implementing the Platform interface.
 *  2. Import and add an instance to the PLATFORMS array below.
 *  3. Add the domain to public/manifest.json (host_permissions + content_scripts.matches).
 *  See README.md for a full walkthrough.
 */

import { AlibabaPlatform } from "./alibaba"
import { AliExpressPlatform } from "./aliexpress"
import { AmazonPlatform } from "./amazon"
import { ApplePlatform } from "./apple"
import { BestBuyPlatform } from "./bestbuy"
import { BhPhotoPlatform } from "./bhphoto"
import { CostcoPlatform } from "./costco"
import { EbayPlatform } from "./ebay"
import { EtsyPlatform } from "./etsy"
import { HomeDepotPlatform } from "./homedepot"
import { IkeaPlatform } from "./ikea"
import { LowesPlatform } from "./lowes"
import { MicrocenterPlatform } from "./microcenter"
import { NeweggPlatform } from "./newegg"
import type { Platform } from "./platform"
import { SheinPlatform } from "./shein"
import { TargetPlatform } from "./target"
import { TemuPlatform } from "./temu"
import { WalmartPlatform } from "./walmart"
import { WayfairPlatform } from "./wayfair"

// Re-exported so callers can import Platform from this barrel rather than
// reaching into the internal platform.ts module.
export type { Platform } from "./platform"

/** All registered platform adapters. Checked in order — first match wins. */
const PLATFORMS: Platform[] = [
  new AmazonPlatform(),
  new EbayPlatform(),
  new WalmartPlatform(),
  new TargetPlatform(),
  new BestBuyPlatform(),
  new CostcoPlatform(),
  new AliExpressPlatform(),
  new TemuPlatform(),
  new SheinPlatform(),
  new WayfairPlatform(),
  new IkeaPlatform(),
  new HomeDepotPlatform(),
  new LowesPlatform(),
  new EtsyPlatform(),
  new AlibabaPlatform(),
  new NeweggPlatform(),
  new ApplePlatform(),
  new BhPhotoPlatform(),
  new MicrocenterPlatform(),
]

/**
 * Returns the platform adapter for the given URL, or null if the URL does not
 * match any registered platform.
 *
 * Defaults to `window.location.href`, so content-script callers can omit the
 * argument entirely.
 */
export function detectPlatform(url: string = window.location.href): Platform | null {
  return PLATFORMS.find((p) => p.matchesUrl(url)) ?? null
}
