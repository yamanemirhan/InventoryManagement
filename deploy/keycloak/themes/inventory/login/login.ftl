<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=realm.registrationAllowed && !registrationDisabled??; section>
  <#if section == "header">${msg("loginAccountTitle")}
  <#elseif section == "form">
    <form id="kc-form-login" action="${url.loginAction}" method="post">
      <#if !usernameHidden??><div class="field"><label for="username">${msg("email")}</label><input id="username" name="username" type="email" value="${(login.username)!''}" autocomplete="username" required autofocus></div></#if>
      <div class="field"><label for="password">${msg("password")}</label><div class="password-group"><input id="password" name="password" type="password" autocomplete="current-password" required><button class="password-toggle" type="button" data-inventory-toggle="password" aria-label="${msg('showPassword')}" data-show="${msg('showPassword')}" data-hide="${msg('hidePassword')}">${msg("showPassword")}</button></div></div>
      <div class="form-options"><#if realm.rememberMe && !usernameHidden??><label class="checkbox"><input id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if>> ${msg("rememberMe")}</label></#if><#if realm.resetPasswordAllowed><a href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></#if></div>
      <input type="hidden" name="credentialId" value="${(auth.selectedCredential)!''}">
      <button id="kc-login" class="button button-primary button-block" name="login" type="submit">${msg("doLogIn")}</button>
    </form>
  <#elseif section == "socialProviders">
    <#if social?? && social.providers?has_content><div class="divider">${msg("inventoryOr")}</div><ul class="social-list"><#list social.providers as provider><li><a class="button button-secondary button-block" href="${provider.loginUrl}">${msg("inventoryContinueWith", provider.displayName)}</a></li></#list></ul></#if>
  <#elseif section == "info"><span>${msg("noAccount")} <a href="${url.registrationUrl}">${msg("doRegister")}</a></span>
  </#if>
</@layout.registrationLayout>
