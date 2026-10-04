<#macro field id label>
<div class="field">
  <label for="${id}">${msg(label)}</label>
  <div class="password-group"><input id="${id}" name="${id}" type="password" autocomplete="new-password" minlength="12" maxlength="128" required <#if id == 'password'>aria-describedby="password-rules"</#if>><button class="password-toggle" type="button" data-inventory-toggle="${id}" aria-label="${msg('showPassword')}" data-show="${msg('showPassword')}" data-hide="${msg('hidePassword')}">${msg("showPassword")}</button></div>
  <#if id == 'password'><p class="help" id="password-rules">${msg("inventoryPasswordRules")}</p></#if>
  <#if messagesPerField.existsError(id)><span class="field-error" role="alert">${kcSanitize(messagesPerField.get(id))?no_esc}</span></#if>
</div>
</#macro>
