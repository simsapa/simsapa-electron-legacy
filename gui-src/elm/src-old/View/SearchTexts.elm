module View.SearchTexts exposing (view)

import Html exposing (..)
import Markdown.Config as MDConf
import Material.LayoutGrid as Grid
import Material.Options as Options exposing (cs, css, onClick, onInput, styled, when)
import Material.Textfield as TF
import Model exposing (Model)
import Msg exposing (Msg(..))
import RemoteData exposing (WebData)
import Types exposing (..)
import View.LookupWord
import View.ReadText exposing (viewRootText, viewTranslatedText)


view : Model -> Html Msg
view model =
    let
        state =
            model.textSearchState
    in
    Grid.view []
        [ Grid.cell
            [ Grid.span6
            , css "padding" "1em"
            , css "overflow" "scroll"
            , css "max-height" "800px"
            ]
            [ styled Html.div
                []
                [ TF.view Mdc
                    "query-input"
                    model.mdc
                    [ onInput SetTextLookupQuery
                    , Options.id "query-input"
                    , TF.autofocus
                    , TF.label "Find texts"
                    , TF.value state.lookupQuery
                    ]
                    []
                ]
            , styled Html.div
                []
                [ viewLookupResults state.lookupResults model ]
            ]
        , Grid.cell
            [ Grid.span6
            , css "padding" "1em"
            , css "overflow" "scroll"
            , css "max-height" "800px"
            ]
            [ styled Html.div
                []
                [ viewSelectedText model ]
            ]
        , Grid.cell
            [ Grid.span12
            , css "padding" "1em"
            , css "overflow" "scroll"
            , css "max-height" "200px"
            , css "border-top" "1px #ccc solid"
            ]
            [ View.LookupWord.view model ]
        ]


viewLookupResults : WebData TextQueryData -> Model -> Html Msg
viewLookupResults results model =
    case results of
        RemoteData.NotAsked ->
            div [] []

        RemoteData.Loading ->
            div [] [ text "loading" ]

        RemoteData.Failure _ ->
            div [] [ text "O NOES" ]

        RemoteData.Success res ->
            viewQueryData res model


viewQueryData : TextQueryData -> Model -> Html Msg
viewQueryData data model =
    div []
        [ div [] (List.map (\x -> viewRootTextRow x model) data.root_texts)
        , div [] (List.map (\x -> viewTranslatedTextRow x model) data.translated_texts)
        ]


viewRootTextRow : RootText -> Model -> Html Msg
viewRootTextRow root_text model =
    let
        words =
            String.words root_text.content_plain

        snippet =
            if List.length words > 20 then
                String.join " " (List.take 20 words) ++ "..."

            else
                String.join " " words
    in
    styled Html.div
        [ cs "hover-gray"
        , css "padding" "0.5em"
        , onClick (AddToSelectedTexts (SelectedRootText root_text))
        ]
        [ styled Html.div
            [ css "font-weight" "bold" ]
            [ text root_text.acronym ]
        , styled Html.div
            [ css "font-weight" "bold" ]
            [ text root_text.title ]
        , styled Html.div
            [ css "padding-left" "1em" ]
            [ text snippet ]
        ]


viewTranslatedTextRow : TranslatedText -> Model -> Html Msg
viewTranslatedTextRow translated_text model =
    let
        words =
            String.words translated_text.content_plain

        snippet =
            if List.length words > 20 then
                String.join " " (List.take 20 words) ++ "..."

            else
                String.join " " words
    in
    styled Html.div
        [ cs "hover-gray"
        , css "padding" "0.5em"
        , onClick (AddToSelectedTexts (SelectedTranslatedText translated_text))
        ]
        [ styled Html.div
            [ css "font-weight" "bold" ]
            [ text translated_text.acronym ]
        , styled Html.div
            [ css "font-weight" "bold" ]
            [ text translated_text.translated_title ]
        , styled Html.div
            [ css "font-style" "italic" ]
            [ text translated_text.author_uid ]
        , styled Html.div
            [ css "padding-left" "1em" ]
            [ text snippet ]
        ]


viewSelectedText : Model -> Html Msg
viewSelectedText model =
    case model.textSearchState.selectedText of
        Just t ->
            case t of
                SelectedRootText t_ ->
                    viewRootText t_

                SelectedTranslatedText t_ ->
                    viewTranslatedText t_

        Nothing ->
            div [] []


mdRawHtml =
    Just (MDConf.Options False MDConf.ParseUnsafe)
