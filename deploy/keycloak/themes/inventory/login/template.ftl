<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!doctype html>
<html lang="${lang}" <#if realm.internationalizationEnabled>dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark light">
  <title>${msg("inventoryBrand")} · ${msg("inventoryAccount")}</title>
  <link rel="icon" href="${url.resourcesPath}/img/mark.svg?v=${properties.inventoryVersion!'1'}" type="image/svg+xml">
  <link rel="stylesheet" href="${url.resourcesPath}/css/inventory.css?v=${properties.inventoryVersion!'1'}">
  <script src="${url.resourcesPath}/js/inventory.js?v=${properties.inventoryVersion!'1'}" defer></script>
  <script type="importmap">{"imports":{"rfc4648":"${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"}}</script>
  <#if scripts??><#list scripts as script><script src="${script}" defer></script></#list></#if>
</head>
<body data-inventory-auth="true" data-page-id="${pageId}" class="${bodyClass}">
  <header class="site-header">
    <a class="brand" href="${(client.baseUrl)!'/auth/login'}"><img src="${url.resourcesPath}/img/mark.svg?v=${properties.inventoryVersion!'1'}" alt="" width="34" height="34"> ${msg("inventoryBrand")}</a>
    <#if realm.internationalizationEnabled && locale.supported?size gt 1>
      <nav aria-label="${msg('languages')}" class="languages"><#list locale.supported as language><a href="${language.url}" aria-label="${language.label}" <#if language.label == locale.current>aria-current="true"</#if>><#if language.url?contains('kc_locale=tr')>TR<#else>EN</#if></a></#list></nav>
    </#if>
  </header>
  <main class="auth-shell">
    <aside class="intro"><span class="eyebrow">${msg("inventoryWorkspace")}</span><h2>${msg("inventoryWelcome")}</h2><p>${msg("inventoryDescription")}</p><div class="intro-detail">${msg("inventorySecurity")}</div></aside>
    <section class="card" aria-labelledby="kc-page-title">
      <div class="card-mark"><img src="${url.resourcesPath}/img/mark.svg?v=${properties.inventoryVersion!'1'}" alt="" width="36" height="36"></div>
      <h1 id="kc-page-title"><#nested "header"></h1>
      <#if displayRequiredFields><p class="required-note">${msg("requiredFields")}</p></#if>
      <#if auth?has_content && auth.showUsername() && !auth.showResetCredentials()>
        <div class="signed-in-as">${auth.attemptedUsername} <a href="${url.loginRestartFlowUrl}">${msg("inventoryChangeAccount")}</a></div>
      </#if>
      <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div class="notice notice-${message.type}" role="<#if message.type == 'error'>alert<#else>status</#if>">${kcSanitize(message.summary)?no_esc}</div>
      </#if>
      <#nested "form">
      <#if auth?has_content && auth.showTryAnotherWayLink()>
        <form action="${url.loginAction}" method="post"><button class="button button-secondary button-block" name="tryAnotherWay" value="on">${msg("doTryAnotherWay")}</button></form>
      </#if>
      <#nested "socialProviders">
      <#if displayInfo><div class="additional-info"><#nested "info"></div></#if>
      <footer class="card-footer">${msg("inventorySecurity")}</footer>
    </section>
  </main>
  <script type="module">
    <#outputformat "JavaScript">
    import { startSessionPolling<#if authenticationSession??>, checkAuthSession</#if> } from "${url.resourcesPath}/js/authChecker.js";
    startSessionPolling(${url.ssoLoginInOtherTabsUrl?c});
    <#if authenticationSession??>checkAuthSession(${authenticationSession.authSessionIdHash?c});</#if>
    </#outputformat>
  </script>
</body>
</html>
</#macro>
