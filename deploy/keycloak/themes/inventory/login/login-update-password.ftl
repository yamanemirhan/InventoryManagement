<#import "template.ftl" as layout>
<#import "password-fields.ftl" as passwordFields>
<@layout.registrationLayout; section>
  <#if section == "header">${msg("updatePasswordTitle")}
  <#elseif section == "form">
    <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
      <div class="field"><label for="password-new">${msg("passwordNew")}</label><div class="password-group"><input id="password-new" name="password-new" type="password" autocomplete="new-password" minlength="12" maxlength="128" required aria-describedby="password-rules"><button class="password-toggle" type="button" data-inventory-toggle="password-new" data-show="${msg('showPassword')}" data-hide="${msg('hidePassword')}">${msg("showPassword")}</button></div><p class="help" id="password-rules">${msg("inventoryPasswordRules")}</p></div>
      <@passwordFields.field id="password-confirm" label="passwordConfirm" />
      <#if isAppInitiatedAction??><label class="checkbox field"><input type="checkbox" name="logout-sessions" value="on" checked> ${msg("logoutOtherSessions")}</label></#if>
      <button class="button button-primary button-block" type="submit">${msg("doSubmit")}</button>
      <#if isAppInitiatedAction??><button class="button button-secondary button-block" name="cancel-aia" value="true" formnovalidate>${msg("doCancel")}</button></#if>
    </form>
  </#if>
</@layout.registrationLayout>
